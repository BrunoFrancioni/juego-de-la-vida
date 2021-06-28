import React, { useCallback, useEffect, useRef, useState } from "react";
/**
    Para ir actualizando los estados de la tabla utilizo la libreria immer.
    Trate de actualizar el estado de la tabla con una funcion normal, pero
    no logre que funcione de forma correcta.
    
    Investigando y buscando ejemplos, encontre esta libreria que fue creada
    para manejar mejor la inmutabilidad de los estados, y que cuando actualizamos
    uno, tengamos el resultado esperado. Sin la libreria me pasaba que asignaba
    una nueva tabla de valores pero la vista no se renderizaba de vuelta.
    
    Voy a utilizar el metodo produce,que toma el estado actual del elemento y
    una funcion que expresa lo que va a pasar con el estado. Durante el proceso, 
    el estado actual del estado no se modifica. La funcion produce, no retorna nada
    simplemente nos deja hacer los cambios que necesitamos en el estado, y luego 
    se encarga de actualizarlo.
*/
import produce from "immer";

import './styles.css';
import Swal from "sweetalert2";
import GenerateTableModal from "../Modals/GenerateTableModal/GenerateTableModal";

const Game = () => {
    /* Variable para guardar la cantidad de filas actuales */
    const [numRows, setNumRows] = useState<number>(50);

    /* Ref para acceder al numero de filas cuando corre el algoritmo */
    const refRows = useRef(numRows);
    refRows.current = numRows;

    /* Variable para guardar la cantidad de columnas */
    const [numCols, setNumCols] = useState<number>(30);

    /* Ref para acceder al numero de columnas cuando corre el algoritmo */
    const refCols = useRef(numCols);
    refCols.current = numCols;

    /* Defino un a funcion para generar una tabla con todos los valores en false */
    const generateEmptyTable = () => {
        const rows = [];

        for (let i = 0; i < numRows; i++) {
            rows.push(Array.from(Array(numCols), () => false));
        }

        return rows;
    };

    /* Variable que va a guardar la matriz con los valores del estado actual */
    const [states, setStates] = useState<Array<Array<boolean>>>(() => {
        return generateEmptyTable()
    });

    /* Variable para guardar si el algoritmo esta corriendo o no */
    const [running, setRunning] = useState<boolean>(false);

    /* Referencia para poder utilizar luego y ver si el algoritmo esta corriendo */
    const prevRunning = useRef(running);
    prevRunning.current = running;

    /* Variable que actua como contador para ver las repeticiones del algoritmo */
    const [generation, setGeneration] = useState<number>(0);

    /* Variable para guardar la velocidad actual y poder ir cambiandola */
    const [speed, setSpeed] = useState<number>(300);

    /* Referencia para poder utilizar luego la velocidad cuando corre el algoritmo */
    const prevSpeed = useRef(speed);
    prevSpeed.current = speed;

    /* Variabla para controlar si mostrar el modal para generar un patron para la tabla */
    const [showModal, setShowModal] = useState<boolean>(false);

    /* Variabla para saber si el patron actual fue importado o no. En caso de haber sido
        importado, no se genera un nuevo patron */
    const [patternImported, setPatternImported] = useState<boolean>(false);

    /* Cuando inicia la apliaciacion, verifico si existe una partida guardada */
    useEffect(() => {
        if (localStorage.getItem('states')) {
            Swal.fire({
                title: 'Existe una partida guardada',
                text: '¿Desea seguir con la partida?',
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Si',
                cancelButtonText: 'No'
            }).then((result) => {
                if (result.isConfirmed) {
                    let states = localStorage.getItem('states')
                    if (states) setStates(JSON.parse(states));

                    let numCols = localStorage.getItem('numCols');
                    if (numCols) setNumCols(Number(numCols));

                    let numRows = localStorage.getItem('numRows');
                    if (numRows) setNumRows(Number(numRows));

                    let generation = localStorage.getItem('generation');
                    if (generation) setGeneration(Number(generation));

                    let speed = localStorage.getItem('speed');
                    if (speed) setSpeed(Number(speed));

                    Swal.fire({
                        position: 'bottom-end',
                        icon: 'success',
                        title: 'Importada!',
                        text: 'Su partida ha sido importada correctamente',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    localStorage.removeItem('states');
                    localStorage.removeItem('numCols');
                    localStorage.removeItem('numRows');
                    localStorage.removeItem('generation');
                    localStorage.removeItem('speed');
                }
            });
        }
    }, [])

    /* Funcion que genera una nueva matriz para el primer estado cuando se inicializa
        el algoritmo. Genera valores random y asi puedo generar la primer matriz 
        a partir de la cual se van a ir calculando los nuevos estados */
    const generateNewState = (cellStatus = () => Math.random() < 0.3) => {
        /* Utilizando el metodo produce de immer me permite generar una nueva tabla
            y manejar mejor los estados */
        const newGrid = produce(states, gridCopy => {
            const grid: Array<Array<boolean>> = [];

            for (let r = 0; r < numRows; r++) {
                grid[r] = [];

                for (let c = 0; c < numCols; c++) {
                    /* Utilizo el cellStatus() para ir generando valores true y false random */
                    grid[r][c] = cellStatus();
                }
            }
            return grid;
        });

        setStates(newGrid);
    };

    /* En esta funcion ejecutamos el algoritmo que toma la variable speed que
        tenemos y setTimeout para poder ejecutar el algoritmo que actualiza la
        tabla */
    const runSimulation = useCallback(() => {
        /* En caso de que ya no estemos mas con running en true, lo que hacemos
            es returnar sin actualizar el estado de la tabla y cortando la 
            recursividad de la funcion */
        if (!prevRunning.current) {
            return;
        }

        setStates(s => {
            /* Dejo que la asignacion la haga immer a traves del metodo produce */
            return produce(s, tableCopy => {
                /** Funcion que se encarga de calcular el total de vecinos vivos de cada celda */
                const amountTrueNeighbors = (r: number, c: number) => {
                    const neighbors = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

                    return neighbors.reduce((trueNeighbors, neighbor) => {
                        const x = r + neighbor[0];
                        const y = c + neighbor[1];
                        const isNeighborOnBoard = (x >= 0 && x < refRows.current && y >= 0 && y < refCols.current);
                        /* No es necesario contar mas de tres vecinos */
                        if (trueNeighbors < 4 && isNeighborOnBoard && s[x][y]) {
                            return trueNeighbors + 1;
                        } else {
                            return trueNeighbors;
                        }
                    }, 0);
                };

                for (let r = 0; r < refRows.current; r++) {
                    for (let c = 0; c < refCols.current; c++) {
                        const totalTrueNeighbors = amountTrueNeighbors(r, c);

                        if (!s[r][c]) {
                            if (totalTrueNeighbors === 3) tableCopy[r][c] = true;
                        } else {
                            if (totalTrueNeighbors < 2 || totalTrueNeighbors > 3) tableCopy[r][c] = false;
                        }
                    }
                }
            });
        });

        /* Aumento la generacion actual */
        setGeneration(gen => {
            return produce(gen, genCopy => {
                return genCopy + 1;
            });
        });

        /* Timeout que llama a recursivamente a la función mientras que estemos en ejecucion */
        setTimeout(runSimulation, prevSpeed.current);
    }, []);

    /* Funcion para iniciar o parar la ejecucion del algoritmo */
    const startStop = () => {
        /* En caso que estemos comenzando la ejecucion, generamos un estado para la tabla */
        if (generation === 0 && !patternImported) {
            generateNewState();
        }

        /* Cambiamos el estado de running para comenzar o parar */
        setRunning(!running);

        /* Verifico por el contrario del valor de running, ya que sel setRunning actualiza
            asincronamente. En caso de ser true, comienzo con el algoritmo */
        if (!running) {
            prevRunning.current = true;
            runSimulation();
        }
    }

    /* Funcion para generar el nuevo estado de la tabla que solo corre una vez */
    const runStep = useCallback(() => {
        /* Genero el nuevo estado de la tabla */
        setStates(s => {
            /* Dejo que la asignacion la haga immer a traves del metodo produce */
            return produce(s, tableCopy => {
                /** Funcion que se encarga de calcular el total de vecinos vivos de cada celda */
                const amountTrueNeighbors = (r: number, c: number) => {
                    const neighbors = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

                    return neighbors.reduce((trueNeighbors, neighbor) => {
                        const x = r + neighbor[0];
                        const y = c + neighbor[1];
                        const isNeighborOnBoard = (x >= 0 && x < refRows.current && y >= 0 && y < refCols.current);
                        /* No es necesario contar mas de tres vecinos */
                        if (trueNeighbors < 4 && isNeighborOnBoard && s[x][y]) {
                            return trueNeighbors + 1;
                        } else {
                            return trueNeighbors;
                        }
                    }, 0);
                };

                for (let r = 0; r < refRows.current; r++) {
                    for (let c = 0; c < refCols.current; c++) {
                        const totalTrueNeighbors = amountTrueNeighbors(r, c);

                        if (!s[r][c]) {
                            if (totalTrueNeighbors === 3) tableCopy[r][c] = true;
                        } else {
                            if (totalTrueNeighbors < 2 || totalTrueNeighbors > 3) tableCopy[r][c] = false;
                        }
                    }
                }
            });
        });

        /* Aumento la generacion actual */
        setGeneration(gen => {
            return produce(gen, genCopy => {
                return genCopy + 1;
            });
        });
    }, []);

    /* Funcion para generar el siguiente paso */
    const step = () => {
        /* En caso que estemos comenzando la ejecucion, generamos un estado para la tabla */
        if (generation === 0 && !patternImported) {
            generateNewState();
        }

        /* Ejecuto el sigiuente paso */
        runStep();
    }

    /* Función para reiniciarl os estados al inicio */
    const restart = () => {
        setPatternImported(false);
        setRunning(false);
        setGeneration(0);
        setStates(() => {
            return generateEmptyTable()
        });
    }

    /* Función que maneja el click en un a celda, y cambia su estado */
    const handleClick = (r: number, c: number) => {
        const newGrid = produce(states, gridCopy => {
            gridCopy[r][c] = states[r][c] ? false : true;
        });

        setStates(newGrid);
    }

    /* Funcion que maneja el cambio de estado del speed */
    const handleChangeSlider = (value: string) => {
        setSpeed(Number(value));
        prevSpeed.current = Number(value);
    }

    /* Funcion que maneja el cambio del estado del 
        numero de filas */
    const handleChangeRows = (value: string) => {
        setNumRows(Number(value));
    }

    /* Funcion que maneja el cambio de estado del
        numero de columnas */
    const handleChangeCols = (value: string) => {
        setNumCols(Number(value));
    }

    /* Funcion que se encagar de solicitar una nueva tabla
        a partir de los nuevos valores de columnas y 
        filas */
    const handleSaveValuesColsRows = (e: React.SyntheticEvent) => {
        e.preventDefault();

        generateNewState();
    }

    /* Funcion que se encarga de guardar la partida */
    const saveMatch = () => {
        Swal.fire({
            title: '¿Seguro que desea guardar la partida?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, guardar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.setItem('numCols', String(numCols));
                localStorage.setItem('numRows', String(numRows));
                localStorage.setItem('generation', String(generation));
                localStorage.setItem('speed', String(speed));
                localStorage.setItem('states', JSON.stringify(states));

                Swal.fire({
                    position: 'bottom-end',
                    icon: 'success',
                    title: 'Guardada!',
                    text: 'Su partida ha sido guardada',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    }

    /* Funcion que toma el patron que envia el modal y lo guarda */
    const saveNewPattern = (numRows: number, numCols: number, table: Array<Array<boolean>>) => {
        setNumRows(numRows);
        setNumCols(numCols);
        setStates(table);
        setGeneration(0);
        setSpeed(300);
        setPatternImported(true);

        setShowModal(false);

        Swal.fire({
            position: 'bottom-end',
            icon: 'success',
            title: 'Patron importado correctamente',
            showConfirmButton: false,
            timer: 1500
        });
    }

    return (
        <>
            <div className="columns is-vcentered options-container">
                <div className="column">
                    <div className="columns">
                        <div className="column">
                            <button
                                className="button is-primary"
                                onClick={() => startStop()}
                                disabled={running}
                            >
                                {(generation !== 0) ? 'Continuar' : 'Iniciar'}
                            </button>
                        </div>

                        <div className="column">
                            <button
                                className="button is-primary"
                                onClick={() => startStop()}
                                disabled={!running}
                            >
                                Detener
                            </button>
                        </div>

                        <div className="column">
                            <button
                                className="button is-primary"
                                onClick={() => step()}
                                disabled={running}
                            >
                                Paso
                            </button>
                        </div>

                        <div className="column">
                            <button
                                className="button is-primary"
                                onClick={() => restart()}
                                disabled={running || generation === 0}
                            >
                                Reiniciar
                            </button>
                        </div>

                        <div className="column">
                            <button
                                className="button is-link"
                                onClick={() => saveMatch()}
                                disabled={running || generation === 0}
                            >
                                Guardar Partida
                            </button>
                        </div>

                        <div className="column">
                            <button
                                className="button is-link"
                                onClick={() => setShowModal(true)}
                                disabled={running}
                            >
                                Generar tabla
                            </button>
                        </div>
                    </div>
                </div>

                <div className="column">
                    <p>Generación: {(generation !== 0) ? generation : '#'}</p>
                </div>
            </div>

            <div className="columns is-vcentered options-container">
                <div className="column">
                    <p className="bold mb-4">Seleccione la velocidad que desea:</p>

                    <input
                        min="50"
                        max="3000"
                        defaultValue={speed}
                        step="50"
                        type="range"
                        onChange={(e) => handleChangeSlider(e.target.value)}
                    />
                    {speed}
                </div>

                <div className="column">
                    <p
                        className="bold mb-4"
                    >Seleccione los valores de las filas y las columnas:</p>

                    <fieldset disabled={running}>
                        <div className="field is-horizontal">
                            <div className="field-body">
                                <div className="columns">
                                    <div className="column is-one-third">
                                        <div className="field is-horizontal">
                                            <div className="field-label is-normal">
                                                <label className="label">Filas</label>
                                            </div>
                                            <div className="field-body">
                                                <input
                                                    min="10"
                                                    className="input"
                                                    type="number"
                                                    defaultValue={numRows}
                                                    onChange={(e) => handleChangeRows(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="column is-one-third">
                                        <div className="field is-horizontal">
                                            <div className="field-label is-normal">
                                                <label className="label">Columnas</label>
                                            </div>
                                            <div className="field-body">
                                                <input
                                                    min="10"
                                                    className="input"
                                                    type="number"
                                                    defaultValue={numCols}
                                                    onChange={(e) => handleChangeCols(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="column is-one-third">
                                        <button
                                            className="button is-info"
                                            type="submit"
                                            onClick={(e) => handleSaveValuesColsRows(e)}
                                        >Guardar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </div>
            </div>

            <div className="box">
                <table>
                    <tbody>
                        {
                            states.map((rows, i) => {
                                return (
                                    <tr key={i}>
                                        {
                                            rows.map((col, k) => {
                                                return (
                                                    <td
                                                        key={`${i},${k}`}
                                                        className={col ? 'alive' : 'dead'}
                                                        onClick={() => handleClick(i, k)}
                                                    />
                                                )
                                            })
                                        }
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>

            {
                showModal &&
                <GenerateTableModal
                    showModal={showModal}
                    handleClose={() => setShowModal(false)}
                    savePattern={(numRows: number, numCols: number, table: Array<Array<boolean>>) =>
                        saveNewPattern(numRows, numCols, table)}
                />
            }
        </>
    );
}

export default Game;
