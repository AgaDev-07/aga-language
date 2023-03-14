# Agal
### Hoy venimos presentando **Agal** un lenguaje de programacion en español basado en matematicas

#### Ejemplo
```js
// En JavaScript

const valor = 5(5);
// TypeError: 5 is not a function
```
```agal
"En Agal"

const valor = 5(5);
"valor = 25"
```

#### Otros de las formulas mas comunes son las elevaciones las cueles en las calculadoras se representan con el simbolo "^"
```js
// En JavaScript

const valor = 5^2;
// Esto depende el entorno de ejecucion pero por lo general se toma como suma dejando un 7 como resultado
```
```agal
"En Agal"

const valor = 5^2;
// valor = 25
```

### pero ya vamos a la sintaxis

```agal
"Declarar Constantes"
const nombre = "Pepe";

"Declarar Variables"
def edad = 28;
edad = 29+1

"Declarar Funciones"
funcion nombre_de_funcion(argumento_1, argumento_2){
  pintar(argumento_1)
  retorna argumento_2
}
```

## Objeto Global
### El objeto global contiene la funcion pintar, requiere, las clases vanilla el modulo en el que se encuentra y otros Objetos como Mate y JSON

## Objeto Mate
### El objeto Mate contiene las propiedades PI, E, abs y redondear
```agal
Mate.PI == 3.14159
Mate.E == 2.71828
Mate.abs(-5) == 5
Mate.redondear(3.14159) == 3
Mate.redondear(3.14159, 4) == 3.1416
```

## Objeto JSON
### El objeto JSON contiene las propiedades texto y parsear
```agal
JSON.texto({hola:'mundo'})
{"hola":"mundo"}

JSON.parsear('{"hola":"mundo"}')
{hola:'mundo'}
```