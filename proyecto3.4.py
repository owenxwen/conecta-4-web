import random

print("Bienvenido a nuestro increible y divertidisimo juego super innovador")

print("Por favor jugadores, a continuacion ingresen sus nombres")

#funcion que verifica los nombres

def verificar_nombre(xjugador):
    nombre = (str(input(f"{xjugador}: ")))

    for numeros in range(10):
        BuscarNumero=nombre.find(str(numeros))

        if BuscarNumero >= 0:
            print("No se admiten numeros en el nombre, ni que fueras \"6 Martinez\"")
            return verificar_nombre(xjugador)
        
    while len(nombre) > 10:
        print(f"Demasiado largo, intente de nuevo {xjugador}")
        return verificar_nombre(xjugador)
    
    while nombre == "":
        print(f"Creo que se te olvido poner algo, por favor {xjugador} intente de nuevo")
        return verificar_nombre(xjugador)

    return nombre

#se ingresan los nombres

jugador_1 = verificar_nombre("jugador 1")
jugador_2 = verificar_nombre("jugador 2")

#funcion que verifica las filas y columnas

def verificar_numero(xnumero):
    numero = (input(f"{xnumero}: "))

    while numero == "":
        print(f"Faltó poner el numero de {xnumero}")
        return verificar_numero(xnumero)

    for caracteres in numero:
        if caracteres not in "0123456789":
            print(f"No se admiten caracteres para el numero de {xnumero}")
            return verificar_numero(xnumero)
    
    numero = int(numero)
    
    while numero < 4:
        print(f"El numero de {xnumero} debe ser mayor que 3")
        return verificar_numero(xnumero)

    return numero

#funcion que define el tablero de juego

def tablero():
    print(*enumeracion)
    print(*limites)
    for casillas in tabla:
        print(*casillas)
    print(*limites)

#funcion verifica los movimientos de los jugadores

def movimientos(jugador, ficha):
    while True:
        columna = (input(f"{jugador} eliga la columna donde caera la ficha (0 para aleatorio): "))

        while columna == "":
            print("Se te olvido poner donde quieres que caiga tu ficha")
            return movimientos(jugador, ficha)

        for caracteres in columna:
            if caracteres not in "0123456789":
                print("No se admiten caracteres en los movimientos")
                return movimientos(jugador, ficha)

        columna = int(columna)

        if columna == 0:
            columnas_disponibles = []
            for c in range(1, len(tabla[0]) - 1):
                if tabla[0][c] == "#":
                    columnas_disponibles.append(c)

            columna = random.choice(columnas_disponibles)
            print(f"Columna seleccionada automáticamente: {columna}")

        elif columna >= (len(tabla[0])-1):
            print("el valor ingresado excedio el numero de columnas")
            continue

        columna_llena = False

        for fila in range(len(tabla) - 1, -1, -1):
            if tabla[fila][columna] == "#":
                tabla[fila][columna] = ficha
                columna_llena = True
                break

        if not columna_llena:
            print("Esa columna ya no admite más fichas")
            continue

        break

    tablero() 

#funcion que revisa si hay 4 fichas consecutivas del mismo simbolo

def verificar_ganador(ficha):
    for fila in range(cantidad_filas):
        for columna in range(1, cantidad_columnas - 2):
            if tabla[fila][columna] == ficha and tabla[fila][columna+1] == ficha and tabla[fila][columna+2] == ficha and tabla[fila][columna+3] == ficha:
                return True

    for fila in range(cantidad_filas - 3):
        for columna in range(1, cantidad_columnas + 1):
            if tabla[fila][columna] == ficha and tabla[fila+1][columna] == ficha and tabla[fila+2][columna] == ficha and tabla[fila+3][columna] == ficha:
                return True

    for fila in range(3, cantidad_filas):
        for columna in range(1, cantidad_columnas - 2):
            if tabla[fila][columna] == ficha and tabla[fila-1][columna+1] == ficha and tabla[fila-2][columna+2] == ficha and tabla[fila-3][columna+3] == ficha:
                return True

    for fila in range(cantidad_filas - 3):
        for columna in range(1, cantidad_columnas - 2):
            if tabla[fila][columna] == ficha and tabla[fila+1][columna+1] == ficha and tabla[fila+2][columna+2] == ficha and tabla[fila+3][columna+3] == ficha:
                return True

    return False

#funcion que revisa si ya no quedan casillas vacias en el tablero

def tablero_lleno():
    for fila in tabla:
        for celda in fila[1:-1]:
            if celda == "#":
                return False
    return True

#funcion que genera el tablero en el archivo.txt

def tablero_texto():
    lineas = []
    lineas.append(" ".join(str(x) for x in enumeracion))
    lineas.append(" ".join(limites))
    for casillas in tabla:
        lineas.append(" ".join(casillas))
    lineas.append(" ".join(limites))
    return "\n".join(lineas)

#funcion que crea el archivo.txt 

def generar_documento_estadisticas():
    with open("estadisticas.txt", "w", encoding="utf-8") as archivo:
        archivo.write("==============================================\n")
        archivo.write("==== Estadísticas de la sesión de juego ====\n")
        archivo.write(f"Nombre del jugador 1: {jugador_1} (X)\n")
        archivo.write(f"Nombre del jugador 2: {jugador_2} (O)\n")
        archivo.write(f"Número de partidas jugadas: {partidas_jugadas}\n")
        archivo.write(f"Número de victorias de {jugador_1}: {victorias[jugador_1]}\n")
        archivo.write(f"Número de victorias de {jugador_2}: {victorias[jugador_2]}\n")
        archivo.write(f"Número de empates: {empates}\n")

        for indice, (tablero_final, resultado) in enumerate(historial_partidas, start=1):
            archivo.write(f"==== Tablero al final de la partida #{indice} ====\n")
            archivo.write(tablero_final + "\n")
            archivo.write(resultado + "\n")

        archivo.write("==============================================\n")

#variables que acumulan las estadisticas de toda la sesion

partidas_jugadas = 0
victorias = {jugador_1: 0, jugador_2: 0}
empates = 0
historial_partidas = []

#se juega una cantidad indefinida de rondas, conservando los nombres ya ingresados

while True:

    print("Por favor, ingresen el numero de filas y columnas que conformaran el tablero de juego")
    cantidad_filas = verificar_numero("filas")
    cantidad_columnas = verificar_numero("columnas")

    #variables que utilizara el tablero de juego 
    enumeracion = []
    contador = 0
    limites = []
    tabla = []

    #especificaciones del tablero de juego
    for i in range(cantidad_columnas):
        contador += 1
        enumeracion.append(contador)

    enumeracion.insert(0,"")
    enumeracion.insert(0,"")

    for i in range(cantidad_columnas):
        limites.append("-")
    limites.append("+")   
    limites.insert(0,"+")

    for i in range(cantidad_filas):
        casillas = []
        for j in range(cantidad_columnas):
            casillas.append("#")
        casillas.insert(0,"|")
        casillas.append("|")
        tabla.append(casillas)

    tablero()

    #se decide aleatoriamente que jugador inicia la partida

    turnos = [(jugador_1, "X"), (jugador_2, "O")]
    orden_turnos = [0, 1]
    random.shuffle(orden_turnos)

    primer_jugador = turnos[orden_turnos[0]]
    segundo_jugador = turnos[orden_turnos[1]]

    print(f"¡El juego ha comenzado! {primer_jugador[0]} inicia la partida")

    #se juega hasta que haya un ganador o un empate

    resultado_partida = ""

    while True:
        movimientos(primer_jugador[0], primer_jugador[1])

        if verificar_ganador(primer_jugador[1]):
            resultado_partida = f"{primer_jugador[0]} ({primer_jugador[1]}) ha ganado la partida"
            print(resultado_partida)
            victorias[primer_jugador[0]] += 1
            break
        if tablero_lleno():
            resultado_partida = "La partida ha terminado en un empate"
            print(resultado_partida)
            empates += 1
            break

        movimientos(segundo_jugador[0], segundo_jugador[1])

        if verificar_ganador(segundo_jugador[1]):
            resultado_partida = f"{segundo_jugador[0]} ({segundo_jugador[1]}) ha ganado la partida"
            print(resultado_partida)
            victorias[segundo_jugador[0]] += 1
            break
        if tablero_lleno():
            resultado_partida = "La partida ha terminado en un empate"
            print(resultado_partida)
            empates += 1
            break

    partidas_jugadas += 1
    historial_partidas.append((tablero_texto(), resultado_partida))

    #se pregunta si desean jugar otra ronda
    continuar = input("Presionen \"1\" si desean jugar otra ronda, \"0\" si no. ").upper()

    while continuar not in ("1", "0"):
        continuar = input("Respuesta no valida, por favor ingrese 1 o 0: ").upper()

    if continuar == "0":
            generar_documento_estadisticas()
            print("Gracias por jugar, ¡hasta la proxima!")
            break