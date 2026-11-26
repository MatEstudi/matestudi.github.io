/* ---------- Quiz diario ----------
   En «Estudiar» aparece cada día el botón «Quiz Diario». Al pulsarlo sale un aviso con dos opciones:
   · Rechazar → el botón desaparece hasta mañana.
   · Aceptar  → una pregunta de 5 opciones (nivel fácil-medio) de Fonaments o Anàlisi Matemàtica I.
       Acertar → hoy se necesitan 5 min MENOS para completar la racha (55 min).
       Fallar  → hoy se necesitan 5 min MÁS (1 h 5 min).
   El resultado se guarda en S.dq = {'AAAA-MM-DD':'rej'|'win'|'lose'} y core.js lo usa en qual(k).
   La pregunta de cada día sale de la fecha (igual al reabrir) y las opciones se barajan con la misma semilla. */
const QZ_SUBJ={f:'fonaments',a:'analisi'};
/* [asignatura, enunciado, respuesta correcta, 4 incorrectas…, explicación] */
const QZ=[
/* ===== Fonaments de les Matemàtiques ===== */
['f','¿Cuál de estas sentencias es una proposición lógica?','«4 es un número primo»','«¿Qué hora es?»','«x + 2 = 5»','«Cierra la puerta»','«x es mayor que y»','Una proposición tiene un valor de verdad completamente establecido (esta es falsa, pero lo tiene). «x + 2 = 5» o «x es mayor que y» son predicados: dependen de las variables.'],
['f','Si p es verdadera y q es falsa, ¿cuál es el valor de verdad de p → q?','Falso','Verdadero','Indeterminado','Depende de los demás conectores','Es verdadero y falso a la vez','La implicación p → q solo es falsa en un caso: p verdadera y q falsa.'],
['f','La ley de De Morgan dice que ¬(p ∧ q) es equivalente a…','¬p ∨ ¬q','¬p ∧ ¬q','¬p → ¬q','p ∨ q','¬p ∨ q','Al negar una conjunción se niegan sus partes y la «y» pasa a ser «o»: ¬(p ∧ q) ⇔ ¬p ∨ ¬q.'],
['f','La implicación p → q es lógicamente equivalente a…','¬p ∨ q','p ∨ ¬q','¬p ∧ q','q → p','p ∧ ¬q','Es la «ley de la implicación»: p → q ⇔ ¬p ∨ q ⇔ ¬(p ∧ ¬q).'],
['f','¿Cuál es el contrarrecíproco de «p → q»?','¬q → ¬p','q → p','¬p → ¬q','p → ¬q','¬q → p','El contrarrecíproco es siempre equivalente a la implicación original: p → q ⇔ ¬q → ¬p.'],
['f','¿Cuál de estas proposiciones es una tautología?','p ∨ ¬p','p ∧ ¬p','p ∨ p','p ∧ p','p → ¬p','p ∨ ¬p es verdadera para cualquier valor de p. p ∧ ¬p es una contradicción y las demás son contingencias.'],
['f','Modus ponens: a partir de las premisas «p → q» y «p» podemos concluir…','q','p','¬q','¬p','p ∧ ¬q','Si la implicación es cierta y p es cierta, entonces q también lo es.'],
['f','Modus tollens: a partir de las premisas «p → q» y «¬q» podemos concluir…','¬p','q','p','¬p ∨ q','p ∧ q','Si q es falsa y p → q es cierta, p no puede ser cierta: es el contrarrecíproco en forma de regla de inferencia.'],
['f','Si p → q es cierta, se dice que p es una condición ___ para q.','suficiente','necesaria','necesaria y suficiente','contradictoria','equivalente','Si p → q, que p sea cierta basta para asegurar q: es condición suficiente. Y q es condición necesaria para p.'],
['f','«Ser múltiplo de 4» respecto a «ser múltiplo de 2» es una condición…','suficiente, pero no necesaria','necesaria, pero no suficiente','necesaria y suficiente','ni necesaria ni suficiente','contradictoria','Todo múltiplo de 4 es múltiplo de 2 (suficiente), pero 6 es múltiplo de 2 y no de 4 (no es necesaria).'],
['f','La negación de «∀x P(x)» es equivalente a…','∃x ¬P(x)','∀x ¬P(x)','∃x P(x)','¬∃x ¬P(x)','∃!x ¬P(x)','Para refutar que todos cumplen P basta con que alguno no la cumpla: ¬(∀x P(x)) ⇔ ∃x ¬P(x).'],
['f','Sea P(x): «x² = 2» con universo ℝ. ¿Cuál de estas proposiciones es verdadera?','∃x ∈ ℝ : P(x)','∀x ∈ ℝ : P(x)','∃!x ∈ ℝ : P(x)','∀x ∈ ℝ : ¬P(x)','Ninguna de las anteriores','√2 cumple P, así que ∃x P(x) es cierta. Pero no todos los reales la cumplen, y además −√2 también la cumple, por lo que no hay unicidad.'],
['f','En ℝ, la proposición ∀y ∃x (x + y = 0) significa…','Todo número real tiene un opuesto respecto a la suma (es verdadera)','Existe un real que sumado a cualquier otro da 0 (es verdadera)','Existe un real que sumado a cualquier otro da 0 (es falsa)','Ningún real tiene opuesto (es falsa)','El 0 es el único número con opuesto (es verdadera)','Con ∀y ∃x, el x puede depender de y: basta tomar x = −y. Por eso es verdadera.'],
['f','En ℝ, la proposición ∃x ∀y (x + y = 0) es…','Falsa: no hay un único x que sumado a todos los y dé 0','Verdadera: sirve x = 0','Verdadera: sirve x = −y','Falsa: porque 0 + 0 ≠ 0','Verdadera: es equivalente a ∀y ∃x (x + y = 0)','El orden de los cuantificadores importa: aquí el x debería valer para todos los y a la vez, y eso es imposible.'],
['f','Una demostración por reducción al absurdo consiste en…','suponer que el resultado es falso y llegar a una contradicción','suponer que el resultado es cierto y comprobar todos los casos','demostrar ¬q → ¬p','encontrar un contraejemplo','probar el caso base y el paso inductivo','Se supone la negación de lo que queremos probar y se deduce algo absurdo; entonces el resultado tiene que ser cierto.'],
['f','Para refutar una proposición del tipo «∀x P(x)» basta con…','encontrar un contraejemplo: un c tal que P(c) sea falso','encontrar un c tal que P(c) sea cierto','comprobarla con muchos valores y ver que se cumple','probar ∃x P(x)','hacer una demostración por inducción','Un solo caso en que P falla ya destruye una afirmación universal.'],
['f','Una demostración por inducción ordinaria consta de…','un caso base y un paso inductivo P(n) → P(n+1)','solo comprobar P(n) para muchos valores','solo el paso inductivo','un caso base y un contraejemplo','una hipótesis de absurdo y un caso base','Se prueba P(n₀) y que, suponiendo P(n) para un n arbitrario, también se cumple P(n+1).'],
['f','Para demostrar por contrarrecíproco que «si n² es par, entonces n es par», se supone que…','n es impar y se prueba que n² es impar','n es par y se prueba que n² es par','n² es impar y se prueba que n es par','n es par y se prueba que n² es impar','n² es par y se prueba que n es impar','El contrarrecíproco de «n² par → n par» es «n impar → n² impar».'],
['f','Si A = {1, 2, 3}, ¿cuántos elementos tiene el conjunto de partes P(A)?','8','3','6','9','7','P(A) tiene 2³ = 8 elementos: ∅, {1}, {2}, {3}, {1,2}, {1,3}, {2,3} y {1,2,3}.'],
['f','Si A = {1, 2, 3} y B = {5, 7}, ¿cuántos elementos tiene A × B?','6','5','8','9','12','El producto cartesiano tiene |A|·|B| = 3·2 = 6 pares ordenados.'],
['f','La función f : ℤ → ℤ definida por f(x) = x² es…','ni inyectiva ni exhaustiva','inyectiva pero no exhaustiva','exhaustiva pero no inyectiva','biyectiva','inyectiva y exhaustiva','f(1) = f(−1) = 1 (no es inyectiva) y, por ejemplo, 2 no es el cuadrado de ningún entero (no es exhaustiva).'],
['f','La inversa de la función biyectiva f : ℤ → ℤ, f(x) = x + 2, es…','f⁻¹(x) = x − 2','f⁻¹(x) = 2 − x','f⁻¹(x) = x + 2','f⁻¹(x) = 1/(x + 2)','f⁻¹(x) = 2x','Se comprueba que f⁻¹(f(x)) = (x + 2) − 2 = x.'],
['f','Dadas f : A → B y g : B → C, la composición (g ∘ f)(x) es…','g(f(x))','f(g(x))','f(x) · g(x)','f(x) + g(x)','g(x) ∘ f(x)','Primero se aplica f y después g.'],
['f','Si f y g son biyectivas, la inversa de la composición (g ∘ f)⁻¹ es…','f⁻¹ ∘ g⁻¹','g⁻¹ ∘ f⁻¹','g ∘ f','f ∘ g','f⁻¹ · g⁻¹','Se deshace primero lo último que se hizo, como al quitarse los calcetines y los zapatos: (g ∘ f)⁻¹ = f⁻¹ ∘ g⁻¹.'],
['f','Una relación reflexiva, simétrica y transitiva se llama…','relación de equivalencia','orden parcial','aplicación','partición','recubrimiento','Son las tres propiedades de una equivalencia. Un orden parcial es reflexivo, antisimétrico y transitivo.'],
['f','Una relación reflexiva, antisimétrica y transitiva se llama…','orden parcial','relación de equivalencia','aplicación','partición','conjunto cociente','Es la definición de orden (parcial). Si además todo par de elementos es comparable, es un orden total.'],
['f','Si ∼ es una relación de equivalencia sobre A, el conjunto cociente A/∼ es…','una partición de A','un subconjunto de A que contiene un solo elemento','el producto cartesiano A × A','siempre el conjunto vacío','una aplicación de A en A','Las clases de equivalencia son no vacías, disjuntas y su unión es todo A: forman una partición.'],
['f','En el conjunto A = {2, 3, 6, 9, 18} con la relación de divisibilidad, ¿cuál es el máximo?','18','2','6','9','No tiene máximo','Todos los elementos de A dividen a 18, así que 18 es el máximo.'],
['f','En el conjunto A = {2, 3, 6, 9, 18} con la divisibilidad, ¿qué elementos son minimales?','2 y 3','Solo el 2','6 y 9','Solo el 18','2, 3 y 6','2 y 3 no tienen divisores propios dentro de A. En cambio 2 | 6 y 3 | 9, así que 6 y 9 no son minimales.'],
['f','Un conjunto infinito A es numerable si…','existe una aplicación biyectiva f : ℕ → A','no existe ninguna aplicación de ℕ en A','es un subconjunto de ℝ','tiene supremo','es finito','Numerable significa que sus elementos se pueden poner «en fila» como los naturales.'],
['f','¿Qué significa 3 | 12?','Existe un entero k tal que 12 = 3k','Existe un entero k tal que 3 = 12k','3 es mayor que 12','12 divide a 3','12 es un número primo','m | n significa que n es múltiplo de m: n = m·k con k entero.'],
['f','Con el algoritmo de Euclides, ¿cuál es el máximo común divisor de 48 y 18?','6','3','9','12','2','48 = 2·18 + 12; 18 = 1·12 + 6; 12 = 2·6 + 0. El último resto no nulo es 6.'],
['f','¿Para cuál de estos valores de c tiene solución entera la ecuación 6x + 9y = c?','12','10','7','13','5','Tiene solución entera si y solo si mcd(6, 9) = 3 divide a c. De la lista solo 12 es múltiplo de 3 (x = 2, y = 0).'],
['f','La descomposición en factores primos de 60 es…','2² · 3 · 5','2 · 3 · 10','2 · 5 · 6','4 · 15','2 · 3² · 5','Por el Teorema Fundamental de la Aritmética, 60 = 2·2·3·5. Las demás opciones contienen factores no primos o dan otro número.'],
['f','La prueba de que existe un primo p > n usando m = n! + 1 es una demostración…','existencial no constructiva','existencial constructiva','por contraejemplo','por inducción','por casos (par e impar)','Se asegura que existe un primo mayor que n sin decir explícitamente cuál es: no es constructiva.'],
['f','En la inducción completa (fuerte), la hipótesis de inducción es que…','P(k) es cierto para todo k con n₀ ≤ k ≤ n','solo P(n) es cierto','P(n+1) es cierto','solo P(n₀) es cierto','P(k) es cierto para todo k ≥ n','En la inducción fuerte se supone cierto todo lo anterior (desde el caso base hasta n), no solo P(n).'],
['f','Para demostrar una proposición del tipo ∃!x P(x) hay que probar…','existencia y unicidad','solo existencia','solo unicidad','∀x P(x)','que hay al menos dos valores que cumplen P','∃!x P(x) ⇔ [∃x P(x)] ∧ [∀x ∀y ((P(x) ∧ P(y)) → x = y)].'],
['f','Sea X = {1, 2, …, 10}, A1 = {1, 2, 3, 4, 5, 7, 9} y A2 = {2, 4, 6, 8, 10}. La familia {A1, A2} es…','un recubrimiento de X pero no una partición, porque A1 ∩ A2 ≠ ∅','una partición de X','ni recubrimiento ni partición, porque A1 ∪ A2 ≠ X','una partición, porque A1 ∪ A2 = X','un recubrimiento, pero A1 ∪ A2 = ∅','A1 ∪ A2 = X, así que cubre X; pero 2 y 4 están en ambos conjuntos, por lo que no son disjuntos y no es partición.'],
['f','Dada una aplicación f : A → B, la relación ker(f) definida por a ∼ a′ ⇔ f(a) = f(a′) es…','una relación de equivalencia sobre A','un orden total sobre A','una aplicación de B en A','un subconjunto de B','siempre la identidad','Es reflexiva, simétrica y transitiva porque se hereda de la igualdad en B.'],
['f','Para demostrar una doble implicación p ↔ q se prueban…','p → q y q → p','solo p → q','p → q y ¬q → p','solo q → p','p ∧ q y ¬p ∧ ¬q','p ↔ q ⇔ (p → q) ∧ (q → p).'],

/* ===== Anàlisi Matemàtica I (Nombres reals) ===== */
['a','Un conjunto con dos operaciones que cumplen los axiomas A1–A5 (asociativa, neutro, opuesto e inverso, conmutativa, distributiva) se llama…','cuerpo conmutativo','grupo abeliano','espacio vectorial','cuerpo ordenado y completo','conjunto inductivo','Con los cinco axiomas algebraicos, (ℝ, +, ·) es un cuerpo conmutativo. Un grupo abeliano solo exige A1–A4 con una operación.'],
['a','La ley de tricotomía (axioma A6) afirma que, para cada x ∈ ℝ…','o bien x = 0, o bien x es positivo, o bien −x es positivo','x es entero o racional','x < 0 o x > 0, siempre','x = 0 y x es positivo a la vez','x tiene opuesto pero no inverso','Se cumple exactamente una de las tres: x = 0, x ∈ ℝ⁺ o −x ∈ ℝ⁺.'],
['a','¿Por qué −x se lee «opuesto de x» y no «menos x»?','Porque −x no tiene por qué ser negativo: si x es negativo, −x es positivo','Porque −x es siempre negativo','Porque −x solo existe si x > 0','Porque −x es lo mismo que 1/x','Porque −x se define con el orden','El opuesto es un concepto algebraico, independiente del orden. Por ejemplo, el opuesto de −3 es 3.'],
['a','Si x < y y z < 0, entonces…','xz > yz','xz < yz','xz = yz','x + z > y + z','no se puede decir nada','Al multiplicar una desigualdad por un número negativo, el sentido se invierte.'],
['a','El producto xy es positivo si y solo si…','x e y son ambos positivos o ambos negativos','x e y son ambos positivos','x > 0 o y > 0','x + y > 0','x ≠ y','Si tienen signos distintos el producto es negativo; si alguno es 0, el producto es 0.'],
['a','Si y ≥ 0, la desigualdad |x| ≤ y equivale a…','−y ≤ x ≤ y','x ≤ y','x ≥ y o x ≤ −y','x² ≥ y','−y < x < 0','Que la distancia de x al origen sea como mucho y significa que x está entre −y e y.'],
['a','La desigualdad triangular afirma que, para x, y ∈ ℝ…','|x + y| ≤ |x| + |y|','|x + y| ≥ |x| + |y|','|x + y| = |x| + |y| siempre','|xy| ≤ |x| + |y|','|x − y| ≥ |x| + |y|','La igualdad solo se da cuando xy ≥ 0, es decir, cuando x e y no tienen signos opuestos.'],
['a','¿Cuál es el conjunto de soluciones de |x² − 1| ≤ 3?','−2 ≤ x ≤ 2','0 ≤ x ≤ 2','−4 ≤ x ≤ 4','−1 ≤ x ≤ 1','x ≤ 2','−3 ≤ x² − 1 ≤ 3 ⇔ −2 ≤ x² ≤ 4 ⇔ x² ≤ 4 ⇔ |x| ≤ 2.'],
['a','El supremo de un conjunto A acotado superiormente es…','la menor de las cotas superiores de A','el mayor elemento de A, que siempre pertenece a A','la mayor de las cotas inferiores de A','cualquier cota superior de A','un elemento cualquiera de A','El supremo es la menor cota superior; puede pertenecer o no al conjunto (si pertenece, es el máximo).'],
['a','El axioma de completitud (axioma del supremo) dice que…','todo subconjunto no vacío de ℝ acotado superiormente tiene supremo en ℝ','todo subconjunto de ℝ tiene máximo','todo subconjunto acotado de ℝ es finito','entre dos reales hay siempre un racional','ℕ no está acotado superiormente','Es el axioma A8. De él se deduce, por ejemplo, que todo conjunto no vacío acotado inferiormente tiene ínfimo.'],
['a','Para A = (0, 1] = {x ∈ ℝ : 0 < x ≤ 1}, ¿qué es cierto?','inf A = 0 no pertenece a A (no hay mínimo) y sup A = 1 es el máximo','inf A = 0 es el mínimo y sup A = 1 no es el máximo','A no está acotado','A no tiene ni ínfimo ni supremo','inf A = 1 y sup A = 0','El 0 es la mayor cota inferior pero no está en A; el 1 es la menor cota superior y sí está en A.'],
['a','¿Cuál es el ínfimo del conjunto B = {1/n : n ∈ ℕ}?','0','1','1/2','No tiene ínfimo','−1','Los términos 1/n se acercan a 0 sin llegar a serlo, así que inf B = 0 ∉ B (B no tiene mínimo, pero sí máximo: 1).'],
['a','¿Qué propiedad distingue a ℝ de ℚ?','La completitud (el axioma del supremo)','Ser un cuerpo conmutativo','Estar ordenado','Ser infinito','Cumplir la propiedad asociativa','ℚ también es un cuerpo conmutativo ordenado. Lo que le falta es la completitud: por ejemplo {q ∈ ℚ : q² < 2} no tiene supremo en ℚ.'],
['a','¿Cuál de estos subconjuntos de ℝ es inductivo (contiene al 1 y, si contiene a p, contiene a p + 1)?','{x ∈ ℝ : x ≥ 1}','{x ∈ ℝ : x ≤ 1}','{1, 2, 3}','{x ∈ ℝ : x > 2}','ℕ ∖ {1}','Si x ≥ 1 entonces x + 1 ≥ 1, y 1 está dentro. En las otras opciones falta el 1 o hay un p cuyo p + 1 se sale.'],
['a','¿Cuál de estos axiomas NO cumple ℕ?','La existencia de opuesto de cada elemento','La propiedad asociativa de la suma','La propiedad conmutativa del producto','La propiedad distributiva','La propiedad asociativa del producto','En ℕ no hay 0 ni opuestos (ni inversos), así que no cumple la existencia de elemento neutro de la suma ni de opuesto.'],
['a','El principio de buena ordenación dice que…','todo subconjunto no vacío de ℕ tiene mínimo','todo subconjunto no vacío de ℤ tiene mínimo','todo subconjunto de ℕ tiene máximo','ℕ está acotado superiormente','ℕ es un conjunto finito','Esto es cierto para ℕ pero no para ℤ (que no tiene mínimo).'],
['a','La parte entera de −1,7, E[−1,7], es…','−2','−1','1','2','−1,7','E[y] es el mayor entero menor o igual que y. El mayor entero ≤ −1,7 es −2.'],
['a','La representación canónica (con mcd 1) del número racional 6/10 es…','3/5','6/10','2/5','3/10','5/3','Se dividen numerador y denominador por mcd(6, 10) = 2.'],
['a','En la prueba de que no existe un racional r con r² = 2, se llega a una contradicción porque…','p y q serían ambos pares, pero se había supuesto mcd(p, q) = 1','p sería par y q impar','p² sería impar','q sería negativo','p y q serían ambos primos','Si p²/q² = 2, entonces p² = 2q²; p es par, luego q también, lo que contradice que la fracción sea irreducible.'],
['a','El número decimal periódico 0,121212… (periodo 12) es igual a la fracción…','4/33','12/100','12/90','1/12','1/8','Con x = 0,1212…: 100x − x = 12, luego x = 12/99 = 4/33.'],
['a','Un número real es irracional cuando su expresión decimal es…','ni finita ni periódica','finita','periódica pura','periódica mixta','finita o periódica','Los decimales finitos y los periódicos (puros o mixtos) son exactamente los racionales.'],
['a','La propiedad arquimediana afirma que, si x > 0 e y ∈ ℝ cualquiera…','existe n ∈ ℕ tal que nx > y','existe n ∈ ℕ tal que nx < y para todo y','nx ≤ y para todo n ∈ ℕ','ℕ tiene máximo','x es siempre mayor que y','Dicho con una regla: una regla corta puede medir cualquier distancia colocándola consecutivamente.'],
['a','Un corolario de la propiedad arquimediana es que ℕ…','no está acotado superiormente','tiene máximo','está acotado superiormente por 10⁶','es un conjunto finito','tiene ínfimo igual a 0','Si ℕ estuviera acotado, tendría supremo y se llegaría a una contradicción.'],
['a','Dado ε > 0, la propiedad arquimediana garantiza que…','existe n ∈ ℕ tal que 1/n < ε','existe n ∈ ℕ tal que n < ε','1/n > ε para todo n ∈ ℕ','ε = 0','existe n ∈ ℕ tal que n² = ε','Aplicando la propiedad a x = ε e y = 1 se obtiene nε > 1, es decir, 1/n < ε.'],
['a','Entre dos números reales cualesquiera x < y…','hay infinitos racionales e infinitos irracionales','hay un racional pero ningún irracional','solo hay irracionales','no hay ninguno si están muy próximos','hay exactamente un racional','Es la densidad de ℚ y de ℝ ∖ ℚ en ℝ.'],
['a','Si 0 ≤ x < ε para todo ε > 0, entonces…','x = 0','x = 1','x es irracional','x es negativo','x no existe','Si x fuera positivo, tomando ε = x/2 se tendría x < x/2, lo cual es absurdo.'],
['a','¿Cuál de estos conjuntos es numerable?','ℚ (los racionales)','ℝ (los reales)','ℝ ∖ ℚ (los irracionales)','El intervalo [0, 1]','Ninguno','Los racionales se pueden enumerar agrupándolos por p + q = n. ℝ, los irracionales y [0, 1] no son numerables.'],
['a','Sea f : ℕ → ℤ la biyección con f(1) = 0, f(2n) = n y f(2n + 1) = −n. ¿Cuánto vale f(7)?','−3','3','−7','7','0','7 = 2·3 + 1, así que f(7) = −3.'],
['a','El argumento diagonal de Cantor (construir y = 0,b1b2b3… distinto de todos los xn) sirve para demostrar que…','(0, 1) y, por tanto, ℝ no son numerables','ℚ no es numerable','√2 es irracional','ℤ es numerable','ℕ es finito','Si se pudiera enumerar (0, 1), el número y construido sería distinto de todos y no estaría en la lista: contradicción.'],
['a','El conjunto A = {q ∈ ℚ : q ≥ 0, q² < 2} es no vacío y acotado superiormente. ¿Qué ocurre con su supremo en ℚ?','No existe supremo en ℚ','Es 3/2','Es √2, que pertenece a ℚ','Es 0','Es 2','Su supremo «debería» ser √2, que no es racional. Por eso ℚ no cumple el axioma del supremo.'],
['a','¿Cuánto vale 1 + 2 + 3 + … + 10?','55','50','45','100','110','Por la fórmula demostrada por inducción: n(n + 1)/2 = 10·11/2 = 55.'],
['a','En el paso inductivo de la demostración de P(n) por inducción, se…','supone que P(n) es cierta y se demuestra P(n + 1)','demuestra P(n) para todos los n a la vez','supone P(n + 1) y se demuestra P(n)','comprueba P(n) para n = 1, 2, 3','supone que P(n) es falsa','Lo que se prueba es la implicación P(n) ⇒ P(n + 1); por eso P(n) se llama «hipótesis de inducción».'],
['a','¿Cuál de estos subconjuntos de ℝ es abierto?','(0, 1)','[0, 1]','[0, 1)','{0}','(0, 1]','En (0, 1) todo punto tiene un entorno B(x, r) dentro del conjunto. En los demás, algún extremo o punto no es interior.'],
['a','El entorno B(2, 3) de centro 2 y radio 3 es el intervalo…','(−1, 5)','[−1, 5]','(2, 5)','(−3, 3)','(1, 3)','B(x, r) = (x − r, x + r) = {y : |y − x| < r}.'],
['a','El conjunto {1/n : n ∈ ℕ} tiene un único punto de acumulación. ¿Cuál es?','0','1','1/2','No tiene ninguno','−1','Cerca de 0 siempre hay términos 1/n (por la propiedad arquimediana); cada 1/n es un punto aislado. Además 0 ∉ A, así que A no es cerrado.'],
['a','Un conjunto A ⊂ ℝ es cerrado si y solo si…','su complementario ℝ ∖ A es abierto','A es abierto','A es acotado','A es finito','A contiene a su ínfimo','Es el Teorema 1.5.1. Por ejemplo, ℤ es cerrado porque ℝ ∖ ℤ es abierto.'],
['a','¿Cuánto vale la intersección de todos los intervalos (0, 1/n] con n ∈ ℕ?','∅ (el conjunto vacío)','{0}','(0, 1]','[0, 1]','{1}','Cualquier x > 0 queda fuera de (0, 1/n] para n grande (propiedad arquimediana). Por eso hace falta que los intervalos encajados sean cerrados.']
];

/* ---------- Lógica ---------- */
const qzDay=()=>{S.dq=S.dq&&typeof S.dq==='object'?S.dq:{};return S.dq[dk()]};
/* Pregunta del día: se elige con la fecha y las opciones se barajan con la misma semilla (al reabrir sale igual). */
function qzPick(k=dk()){
  /* La asignatura se alterna cada día (Fonaments / Anàlisi) y la pregunta se sortea dentro de ella */
  const pool=QZ.filter(x=>x[0]===(Math.round(kd(k)/864e5)%2?'a':'f')),it=pool[cgHash('quiz-'+k)%pool.length],ix=[0,1,2,3,4];
  for(let i=4;i>0;i--){const j=cgHash(k+'#'+i)%(i+1);[ix[i],ix[j]]=[ix[j],ix[i]]}
  return{s:QZ_SUBJ[it[0]],q:it[1],o:ix.map(i=>it[2+i]),c:ix.indexOf(0),e:it[7]};
}
/* Tarjeta de «Estudiar»: ahora se muestra en la racha (botón 🧠). Esta función deja de usarse pero se mantiene por compatibilidad. */
function quizCard(){return ''}
function qzIntro(){
  const d=$('#dlg');d.onkeydown=null;
  d.innerHTML=`<h2>Quiz Diario</h2>
  <p class="qzp">Puedes hacer un quiz diario: <b>1 pregunta con 5 opciones</b> de Fonaments o Anàlisi Matemàtica I (nivel fácil-medio).</p>
  <ul class="qzl"><li><span>✅</span><div>Si <b>aciertas</b>, necesitas <b>5 minutos menos</b> para completar la racha de hoy (${hm(QUAL-QZ_MIN)}).</div></li>
  <li><span>❌</span><div>Si <b>fallas</b>, necesitas <b>5 minutos más</b> (${hm(QUAL+QZ_MIN)}).</div></li></ul>
  <small class="sm">Si rechazas, el botón desaparece hasta mañana.</small>
  <div class="acts"><button type="button" class="ghost" data-qz="rej">Rechazar</button><button type="button" class="mini" data-qz="acc">Aceptar</button></div>`;
  d.onclick=qzClick;d.open||d.showModal();
}
function qzAsk(){
  const d=$('#dlg'),p=qzPick();
  d.innerHTML=`<small class="qzs" style="color:${SUBJ[p.s].c}">${esc(SUBJ[p.s].n)} · pregunta del día</small>
  <h2 class="qzq">${esc(p.q)}</h2>
  <div class="qzo">${p.o.map((t,i)=>`<button type="button" class="qzop" data-qz="ans" data-i="${i}"><i>${'ABCDE'[i]}</i><span>${esc(t)}</span></button>`).join('')}</div>
  <div id="qzr"></div>
  <div class="acts" id="qza"><button type="button" class="ghost" data-qz="close">Ahora no</button></div>`;
}
function qzAnswer(i){
  const k=dk(),d=$('#dlg');if(qzDay())return;
  const p=qzPick(k),ok=i===p.c;
  S.dq[k]=ok?'win':'lose';
  const ks=Object.keys(S.dq).sort();ks.slice(0,-400).forEach(x=>delete S.dq[x]);
  d.querySelectorAll('.qzop').forEach((b,j)=>{b.disabled=true;if(j===p.c)b.classList.add('ok');else if(j===i)b.classList.add('bad')});
  $('#qzr').innerHTML=`<div class="qzres ${ok?'ok':'bad'}"><b>${ok?'¡Correcto!':'No era esa.'}</b> ${ok?'Hoy necesitas 5 minutos menos':'Hoy necesitas 5 minutos más'} para la racha: <b>${hm(qual(k))}</b>.<br><span>${esc(p.e)}</span></div>`;
  $('#qza').innerHTML='<button type="button" class="mini" data-qz="close">Continuar</button>';
  save(true);if(typeof sync==='function')sync(true);if(typeof syncProgress==='function')syncProgress(true);
  render();
}
function qzClick(e){
  const b=e.target.closest('[data-qz]');if(!b)return;
  const a=b.dataset.qz;
  if(a==='acc'){if(!qzDay())qzAsk();return}
  if(a==='ans')return qzAnswer(+b.dataset.i);
  if(a==='rej'){const k=dk();if(!qzDay()){S.dq[k]='rej';save(true);if(typeof syncProgress==='function')syncProgress(true);$('#dlg').close();render();toast('Quiz Diario rechazado. Vuelve mañana.')}return}
  if(a==='close')$('#dlg').close();
}
/* El botón de la pestaña Estudiar está fuera del diálogo */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-qz="open"]');if(!b)return;if(qzDay())return render();qzIntro()});
