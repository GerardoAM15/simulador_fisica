# Tabla de validación: analítico vs simulado

Generada con `npm run validacion` (scripts/validacion.ts) a partir del código de `src/physics`.
Ver el análisis en el [informe técnico](informe_tecnico.md#5-pruebas-y-validación).

| # | Unidad | Caso | Magnitud | Analítico | Simulado | Unidad SI | Método | Error (%) |
|---|---|---|---|---|---|---|---|---|
| 1 | U1 | Carga puntual (2 μC, r = 0.5 m) | \|E\| | 7.1900e+4 | 7.1900e+4 | N/C | Superposición | 0 |
| 2 | U1 | Dipolo en el eje (x = 0.4 m) | E | 5.7970e+4 | 5.7970e+4 | N/C | Superposición | < 10⁻⁶ |
| 3 | U1 | Equipotencial de carga puntual | radio | 0.5 | 0.500024 | m | Marching squares | 0.0048 |
| 4 | U1 | Superficie equipotencial 3D | radio | 0.6 | 0.5994 | m | Surface nets | 0.1 |
| 5 | U1 | Electrón en E uniforme (t = 0.2 μs) | y (parábola) | -0.703528 | -0.703528 | m | RK4 | < 10⁻⁶ |
| 6 | U1 | Protón dispersado (conservación) | K + qV | 1.0392e-14 | 1.0392e-14 | J | RK4 adaptativo | < 10⁻⁶ |
| 7 | U2 | Carga RC (R = 1 kΩ, C = 100 μF) | Q(τ) | 6.3212e-4 | 6.3212e-4 | C | RK4 | < 10⁻⁶ |
| 8 | U2 | Energía disipada al cargar | ∫I²R dt | 0.005 | 0.005 | J | Trapecio | 0.000033 |
| 9 | U2 | Capacitores en serie 10 y 20 μF (12 V) | V₁ | 8 | 8.00133 | V | MNA | 0.017 |
| 10 | U3 | Serie 12 V, 2 Ω + 4 Ω | I(R1) | 2 | 2 | A | MNA + Gauss | < 10⁻⁶ |
| 11 | U3 | Paralelo 12 V, 3 Ω ∥ 6 Ω | I(R2) | 2 | 2 | A | MNA + Gauss | 0 |
| 12 | U3 | Mixto 12 V, 2 Ω + (6 Ω ∥ 3 Ω) | I(R3) | 2 | 2 | A | MNA + Gauss | < 10⁻⁶ |
| 13 | U3 | Wheatstone desequilibrado | I galvanómetro | 0.01 | 0.01 | A | MNA vs Thévenin | < 10⁻⁶ |
| 14 | U4 | Hilo recto (r = 0.1 m) | \|B\| | 2.0000e-5 | 2.0000e-5 | T | Biot–Savart | 0.0012 |
| 15 | U4 | Espira, centro (R = 0.2 m) | B | 3.1416e-5 | 3.1422e-5 | T | Biot–Savart | 0.021 |
| 16 | U4 | Espira, eje (z = 0.3 m) | B | 5.3620e-6 | 5.3617e-6 | T | Biot–Savart | 0.0051 |
| 17 | U4 | Solenoide N = 50, L = 1 m (centro) | B | 1.2322e-4 | 1.2333e-4 | T | Biot–Savart | 0.085 |
| 18 | U4 | Espira pequeña lejos (dipolo) | \|B\| | 1.0150e-9 | 1.0150e-9 | T | Biot–Savart | 0.0017 |
| 19 | U4 | Ley de Ampère alrededor del hilo | ∮B·dl | 1.2566e-5 | 1.2566e-5 | T·m | Biot–Savart | 0.0028 |
| 20 | U4 | Movimiento circular (protón) | radio r | 0.104397 | 0.104399 | m | Boris | 0.0023 |
| 21 | U4 | Movimiento circular (protón) | período T | 6.5594e-7 | 6.5609e-7 | s | Boris | 0.023 |
| 22 | U4 | Hélice (60°) | paso p | 0.327972 | 0.328047 | m | Boris | 0.023 |
| 23 | U4 | Deriva E×B (E = 20 kV/m) | v_d | 2.0000e+5 | 2.0046e+5 | m/s | Boris | 0.23 |
| 24 | U4 | Espectrómetro (¹⁴C⁺) | masa m = qBr/v | 2.3247e-26 | 2.3247e-26 | kg | Boris | 0.00061 |
| 25 | U4 | B puro, 1000 vueltas (Boris) | \|v\| | 1.0000e+6 | 1.0000e+6 | m/s | Boris | < 10⁻⁶ |
| 26 | U4 | B puro, 5 vueltas (Euler explícito) | \|v\| | 1.0000e+6 | 1.1063e+8 | m/s | Euler | 11000 |
