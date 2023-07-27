import React, { useState, useEffect, useRef } from 'react';
import './TestIssue445.css';
import TestOutput from './TestOutput';
      
import { sqlite } from '../App';
import { SQLiteDBConnection} from 'react-sqlite-hook';
import { Dialog } from '@capacitor/dialog';

const TestIssue445: React.FC = () => {
    const myRef = useRef(false);
    const myLog: string[] = [];
    const errMess = useRef("");
    const [output, setOutput] = useState({log: myLog});
      const showAlert = async (message: string) => {
        await Dialog.alert({
          title: 'Error Dialog',
          message: message,
        });
    };
    const testDatabaseIssue445 = async (): Promise<Boolean>  => {
        setOutput((output: { log: any; }) => ({log: output.log}));

        myLog.push("* Starting testDatabaseIssue445 *\n");
            try {
            // create a connection for TestIssue445
            let db: SQLiteDBConnection = await sqlite.createConnection("steward");
            // open NoEncryption
            await db.open();
            myLog.push("> open 'steward' successful\n");
            myLog.push("executing create statements on next line\n");
            let res = await db.execute(`
                DROP TABLE IF EXISTS Table_1;
                DROP TABLE IF EXISTS Table_2;

                CREATE TABLE IF NOT EXISTS Table_1 (
                    id INTEGER PRIMARY KEY NOT NULL,
                    product_id TEXT NOT NULL,
                    product_type TEXT DEFAULT 'generic' CHECK (product_type IN ('object', 'book')),
                    result_id TEXT,
                    result_slug TEXT,
                    person_id INTEGER,

                    sql_deleted BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1)),
                    last_modified INTEGER DEFAULT (strftime('%s', 'now')),

                    FOREIGN KEY (result_id, result_slug) REFERENCES Table_2(id, slug) ON DELETE SET DEFAULT
                );

                CREATE TABLE IF NOT EXISTS Table_2 (
                    id TEXT NOT NULL,
                    slug TEXT NOT NULL,

                    sql_deleted BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1)),
                    created_at INTEGER NOT NULL,
                    last_modified INTEGER DEFAULT (strftime('%s', 'now')),

                    PRIMARY KEY (id, slug)
                );
`);
            if(res.changes && res.changes.changes !== 0 &&
                res.changes.changes !== 1){
                errMess.current = `Execute create tables changes < 0`;
                setOutput(() => ({log: myLog}));
                return false;
            } 
            myLog.push(" executed create statements\n");
            myLog.push(" executing insert on next line\n");

            res = await db.execute(
                "INSERT INTO Table_1 (product_id, product_type) VALUES ('MyProduct1', 'object');" +
                "INSERT INTO Table_1 (product_id, product_type) VALUES ('MyProduct2', 'book');"
            );
            if (res.changes && res.changes.changes !== 2) {
                errMess.current = `Execute Insert changes != 2`;
                setOutput(() => ({log: myLog}));
                return false;
            }
            myLog.push(" executed insert\n");

            // Select all chores
            myLog.push(" selecting from table\n");
            const resVal = await db.query("SELECT * FROM Table_1;");
            if(resVal.values && resVal.values.length !== 2) {
                errMess.current = `Query not returning 2 values`;
                setOutput(() => ({log: myLog}));
                return false;
            }
            myLog.push(" Select all from Table_1 \n");


                // Select all chores
                myLog.push("delete from Table_1\n");
                const resVal2 = await db.run("DELETE FROM Table_1 WHERE product_id = ? AND product_type = ?;", [
                    'MyProduct2', 'book'
                ]);

                myLog.push("resVal2");

                // Close Connection steward
            await sqlite.closeConnection("steward"); 
                    
            return true;
        } catch (err: any) {
            errMess.current = `${err.message}`;
            setOutput(() => ({log: myLog}));
            return false;
        }
    }

    useEffect( () => {
        if(sqlite.isAvailable) {
            if (myRef.current === false) {
                myRef.current = true;
                testDatabaseIssue445().then(async res => {
                    if(res) {    
                        myLog.push("\n* The set of tests was successful *\n");
                    } else {
                        myLog.push("\n* The set of tests failed *\n");
                        await showAlert(errMess.current);
                    }
                    setOutput(() => ({log: myLog}));
                        });
            }
        } else {
            sqlite.getPlatform().then(async (ret: { platform: string; })  =>  {
                myLog.push("\n* Not available for " + 
                ret.platform + " platform *\n");
                await showAlert(errMess.current);
                setOutput(() => ({log: myLog}));
            });         
        }
         
      });   
    
      
      return (
        <TestOutput dataLog={output.log} errMess={errMess.current}></TestOutput> 
      );
    };

export default TestIssue445;
