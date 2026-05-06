"""
QA_AIOps — API de Detecção de Anomalias (VERSÃO FINAL)
Pronta para Railway + Frontend React
"""

import io
import os
import pickle
import numpy as np
import pandas as pd
import uvicorn

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# =============================================================================
# CONFIG
# =============================================================================
MODELO_PATH   = "treino.pkl"
LIMITE_ALERTA = 5.0
FEATURES_PADRAO = ["elapsed", "Latency"]

# =============================================================================
# APP
# =============================================================================
app = FastAPI(
    title="QA_AIOps — API de Detecção de Anomalias",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

modelo_data = None

# =============================================================================
# STARTUP
# =============================================================================
@app.on_event("startup")
def carregar_modelo():
    global modelo_data

    try:
        with open(MODELO_PATH, "rb") as f:
            modelo_data = pickle.load(f)

        print(f"✅ Modelo carregado: {MODELO_PATH}")

        if isinstance(modelo_data, dict):
            print(f"✔ Features: {modelo_data.get('features')}")
        else:
            print("✔ Pipeline carregado direto")

    except Exception as e:
        print(f"❌ Erro ao carregar modelo: {e}")

# =============================================================================
# HELPERS
# =============================================================================

def obter_pipeline():
    if modelo_data is None:
        raise HTTPException(503, "Modelo não carregado")

    if isinstance(modelo_data, dict):
        return modelo_data.get("pipeline") or modelo_data.get("modelo")

    return modelo_data


def obter_features(pipeline):
    try:
        return list(pipeline.feature_names_in_)
    except:
        pass

    n = getattr(pipeline, "n_features_in_", None)

    if n == 2:
        return ["elapsed", "Latency"]
    if n == 3:
        return ["elapsed", "Latency", "bytes"]

    return FEATURES_PADRAO


def obter_stats():
    if isinstance(modelo_data, dict):
        return modelo_data.get("stats_normal") or {}
    return {}


def formatar_baseline(stats):
    return {
        "elapsed_mean": stats.get("elapsed_mean", 0),
        "elapsed_p95": stats.get("elapsed_p95", 0),
        "taxa_sucesso": stats.get("taxa_sucesso", 0) * 100,
    }


def preprocessar_csv(df: pd.DataFrame, features: list) -> pd.DataFrame:
    mapa = {
        "latency": "Latency",
        "Latency": "Latency",
        "bytes": "bytes",
        "Bytes": "bytes",
        "elapsed": "elapsed",
        "Elapsed": "elapsed",
    }

    df = df.rename(columns=mapa)

    for col in features:
        if col not in df.columns:
            df[col] = 0

    df = df[features]
    df = df.apply(pd.to_numeric, errors="coerce").fillna(0)

    return df


def validar_dimensoes(X, pipeline, features):
    esperado = getattr(pipeline, "n_features_in_", None)

    if esperado is not None and X.shape[1] != esperado:
        raise HTTPException(
            500,
            detail=(
                f"Modelo espera {esperado} features, "
                f"mas recebeu {X.shape[1]} → {features}"
            )
        )

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/")
def health():
    return {
        "status": "online",
        "modelo_carregado": modelo_data is not None
    }


@app.get("/baseline")
def baseline():
    stats = obter_stats()

    if not stats:
        return {"disponivel": False}

    return {
        "disponivel": True,
        **formatar_baseline(stats)
    }


@app.post("/analisar")
async def analisar(arquivo: UploadFile = File(...)):

    if not arquivo.filename.endswith(".csv"):
        raise HTTPException(400, "Arquivo deve ser CSV")

    try:
        conteudo = await arquivo.read()
        df = pd.read_csv(io.BytesIO(conteudo))
    except Exception as e:
        raise HTTPException(400, f"Erro ao ler CSV: {e}")

    if df.empty:
        raise HTTPException(400, "CSV vazio")

    pipeline = obter_pipeline()
    features = obter_features(pipeline)

    df_proc = preprocessar_csv(df, features)
    X = df_proc.values

    validar_dimensoes(X, pipeline, features)

    try:
        preds = pipeline.predict(X)
    except Exception as e:
        raise HTTPException(500, f"Erro na predição: {e}")

    total = len(preds)
    anomalias = int((preds == -1).sum())
    normais = int((preds == 1).sum())
    pct = round(anomalias / total * 100, 2)

    alerta = pct > LIMITE_ALERTA
    stats = obter_stats()

    print(f"📊 Total: {total} | Normais: {normais} | Anomalias: {anomalias} | {pct}%")

    # registros (otimizado)
    registros = []
    for i in range(len(df)):
        row = df.iloc[i]

        registros.append({
            "index": i,
            "elapsed": int(row.get("elapsed", 0)),
            "Latency": int(row.get("Latency", 0)),
            "bytes": int(row.get("bytes", 0)),
            "success": bool(row.get("success", True)),  # 🔥 corrigido
            "resultado": "Anomalia" if preds[i] == -1 else "Normal",
        })

    return {
        "arquivo": arquivo.filename,
        "total": total,
        "n_anomalias": anomalias,   # 🔥 corrigido
        "n_normais": normais,       # 🔥 corrigido
        "pct_anomalias": pct,
        "alerta": alerta,
        "baseline": formatar_baseline(stats),  # 🔥 corrigido
        "features_usadas": features,
        "registros": registros or []
    }

# =============================================================================
# RUN (Railway Ready)
# =============================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)