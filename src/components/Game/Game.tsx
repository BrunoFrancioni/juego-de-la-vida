import React, { useCallback, useRef, useState } from "react";
import produce from "immer";

import './styles.css';

const numRows: number = 30;
const numCols: number = 50;

const generateEmptyTable = () => {
    const rows = [];

    for (let i = 0; i < numRows; i++) {
        rows.push(Array.from(Array(numCols), () => false));
    }

    return rows;
};

const operations = [
    [0, 1],
    [0, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, 0],
    [-1, 0]
];

const Game = () => {
    const [states, setStates] = useState<Array<Array<boolean>>>(() => {
        return generateEmptyTable()
    });

    const [running, setRunning] = useState<boolean>(false);

    const prevRunning = useRef(running);
    prevRunning.current = running;

    const [generation, setGeneration] = useState<number>(0);

    const generateNewState = (cellStatus = () => Math.random() < 0.3) => {
        const newGrid = produce(states, gridCopy => {
            const grid: Array<Array<boolean>> = [];

            for (let r = 0; r < numRows; r++) {
                grid[r] = [];

                for (let c = 0; c < numCols; c++) {
                    grid[r][c] = cellStatus();
                }
            }
            return grid;
        });

        setStates(newGrid);
    };

    const runSimulation = useCallback(() => {
        if (!prevRunning.current) {
            return;
        }

        setStates(s => {
            return produce(s, tableCopy => {
                for (let i = 0; i < numRows; i++) {
                    for (let k = 0; k < numCols; k++) {
                        let neighbors = 0;

                        operations.forEach(([x, y]) => {
                            const newI = i + x;
                            const newK = k + y;

                            if (newI < 0 && newK < 0) {
                                if (s[numRows - 1][numCols - 1]) neighbors += 1;
                            } else if (newK < 0 && i >= 0 && i <= numRows - 1) {
                                if (s[i][numCols - 1]) neighbors += 1;
                            } else if (newI > numRows - 1 && newK < 0) {
                                if (s[0][numCols - 1]) neighbors += 1;
                            } else if (newI < 0 && newK >= 0 && newK <= numCols - 1) {
                                if (s[numRows - 1][k]) neighbors += 1;
                            } else if (newK > numCols - 1 && newI < 0) {
                                if (s[numRows - 1][0]) neighbors += 1;
                            } else if (newK > numCols - 1 && i >= 0 && i <= numRows - 1) {
                                if (s[i][0]) neighbors += 1;
                            } else if (newK > numCols - 1 && newI > numRows - 1) {
                                if (s[0][0]) neighbors += 1;
                            } else if (newI > numRows - 1 && newK >= 0 && newK <= numCols - 1) {
                                if (s[0][k]) neighbors += 1;
                            } else {
                                if (s[newI][newK]) neighbors += 1;
                            }
                        });

                        if (neighbors < 2 || neighbors > 3) {
                            tableCopy[i][k] = false;
                        } else if (s[i][k] === false && neighbors === 3) {
                            tableCopy[i][k] = true;
                        }
                    }
                }
            });
        });

        setGeneration(gen => {
            return produce(gen, genCopy => {
                return genCopy + 1;
            });
        });

        setTimeout(runSimulation, 300);
    }, []);

    const startStop = () => {
        if (generation === 0) {
            generateNewState();
        }

        setRunning(!running);

        if (!running) {
            prevRunning.current = true;
            runSimulation();
        }
    }

    const stop = () => {
        setRunning(false);
    }

    const restart = () => {
        setRunning(false);
        setGeneration(0);
        setStates(() => {
            return generateEmptyTable()
        });
    }

    const handleClick = (r: number, c: number) => {
        const newGrid = produce(states, gridCopy => {
            gridCopy[r][c] = states[r][c] ? false : true;
        });

        setStates(newGrid);
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
                                onClick={() => stop()}
                                disabled={!running}
                            >
                                Detener
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
                    </div>
                </div>

                <div className="column">
                    <p>Generación: {(generation !== 0) ? generation : '#'}</p>
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
        </>
    );
}

export default Game;
