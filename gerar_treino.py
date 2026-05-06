"""
gerar_treino.py — Gera treino.pkl correto para o QA_AIOps
Execute: python gerar_treino.py
"""
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

np.random.seed(42)
n = 1000

print("⚙  Gerando dados de comportamento NORMAL...")

# Simula requisições normais de uma app web leve
elapsed = np.random.normal(loc=350, scale=50, size=n).clip(100, 600)
latency = elapsed * np.random.uniform(0.85, 0.98, n)
bytes_  = np.random.randint(800, 2500, n)

df = pd.DataFrame({
    "elapsed": elapsed.astype(int),
    "Latency": latency.astype(int),
    "bytes":   bytes_,
})

print(f"   elapsed médio: {df['elapsed'].mean():.0f}ms")
print(f"   elapsed p95:   {df['elapsed'].quantile(0.95):.0f}ms")

X = df[["elapsed", "Latency", "bytes"]].values

print("\n🤖 Treinando Isolation Forest...")
modelo = IsolationForest(
    n_estimators=200,
    contamination=0.05,
    random_state=42,
    n_jobs=-1,
)
modelo.fit(df[["elapsed", "Latency", "bytes"]])  # treina com nomes de features

# Testa
preds = modelo.predict(df[["elapsed", "Latency", "bytes"]])
pct_anom = (preds == -1).sum() / n * 100
print(f"   Anomalias no treino: {pct_anom:.1f}% (esperado ~5%)")

# Stats para o baseline
stats = {
    "elapsed_mean": float(df["elapsed"].mean()),
    "elapsed_p95":  float(df["elapsed"].quantile(0.95)),
    "taxa_sucesso": 1.0,
}

payload = {
    "modelo":    modelo,
    "features":  ["elapsed", "Latency", "bytes"],
    "stats":     stats,
    "stats_normal": stats,  # compatibilidade com a API
}

with open("treino.pkl", "wb") as f:
    pickle.dump(payload, f)

print(f"\n✅ treino.pkl salvo!")
print(f"   elapsed_mean: {stats['elapsed_mean']:.0f}ms")
print(f"   elapsed_p95:  {stats['elapsed_p95']:.0f}ms")
print("\n🚀 Reinicie a API (Ctrl+C e python main.py novamente)")
