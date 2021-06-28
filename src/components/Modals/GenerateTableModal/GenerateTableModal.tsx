import produce from 'immer';
import { useState } from 'react';
import { GenerateTableModalProps } from './types';

import './styles.css';

const GenerateTableModal = (props: GenerateTableModalProps) => {
    /* Variable para guardar la cantidad de filas actuales */
    const [numRows, setNumRows] = useState<number>(50);

    /* Variable para guardar la cantidad de columnas */
    const [numCols, setNumCols] = useState<number>(30);

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
        return generateEmptyTable();
    });

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

        setStates(generateEmptyTable());
    }

    /* Función que maneja el click en un a celda, y cambia su estado */
    const handleClick = (r: number, c: number) => {
        const newGrid = produce(states, gridCopy => {
            gridCopy[r][c] = states[r][c] ? false : true;
        });

        setStates(newGrid);
    }

    /* Envia el nuevo patron a la vista principal y el numero de 
        filas y columnas */
    const handleSavePattern = () => {
        props.savePattern(numRows, numCols, states);
    }

    return (
        <div className={`modal ${props.showModal && 'is-active'}`}>
            <div className="modal-background"></div>

            <div className="modal-card">
                <header className="modal-card-head">
                    <p className="modal-card-title">Generar patrón para tabla</p>
                    <button className="delete" aria-label="close" onClick={() => props.handleClose()}></button>
                </header>

                <section className="modal-card-body">
                    <div className="columns is-vcentered options-container">
                        <div className="column">
                            <p
                                className="bold mb-4"
                            >Seleccione los valores de las filas y las columnas:</p>

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
                </section>

                <footer className="modal-card-foot">
                    <button
                        className="button is-warning"
                        onClick={() => handleSavePattern()}
                    >Save changes</button>

                    <button
                        className="button"
                        onClick={() => props.handleClose()}
                    >Cancel</button>
                </footer>
            </div>
        </div>
    );
}

export default GenerateTableModal;