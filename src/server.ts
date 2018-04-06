/*
 * Import NODE Modules
 */
import * as http from 'http';
import * as https from 'https';
import * as debug from 'debug';
import dotenv from 'dotenv';
import  path from 'path';
import fs from 'fs';
import * as Promise from 'bluebird';

const appRoot = require('app-root-path');

// interfaces
import { ServerOptions, ProcessEnv } from './shared/interfaces/';


/**
 * EXPRESS APPLICATION CODE
 */
import App from './App';
import { test, testForConfiguration } from './util/bootstrap.util';
import { 
    ENVIRONMENT,
    EXPRESS_SERVER_MODE,
    PORT,
    PATH_TO_DEV_PRIVATE_KEY,
    PATH_TO_DEV_CERTIFICATE,
    PATH_TO_PROD_PRIVATE_KEY,
    PATH_TO_PROD_CERTIFICATE
} from './util/secrets';

/**
 * Test if Environment variables for this development mode dev|prod are loaded
 * if no configuration for this environment was found exit with error message
 */
testForConfiguration();

/** 
 * SERVER containers
 */
let 
    server:any,
	cluster:any,
    env:string=ENVIRONMENT.toString(),
	options:ServerOptions = {};

const    
    myGlobal:any = global;

// #TODO: move functions to utility file

/****
 * For node application with multiple instances
 */
function setCluster(i:number) {    
    setTimeout ( () => {             
        let worker = cluster.fork();       
    }, i * 5000 );
}


/**
 * Error Handler
 */
function onError(error: NodeJS.ErrnoException):void {
    if (error.syscall !== 'listen') throw error;
    let bind = (typeof PORT === 'string') ? 'Pipe ' + PORT : 'Port ' + PORT;
    switch(error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
        break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
        break;
        default:
            throw error;
    }
}

/***
 * SSL Certificates
 */ 
function getSSL():ServerOptions {

    let options:ServerOptions = { key: null, cert:null };

    switch (ENVIRONMENT) {
        case 'dev': 
            options.key = getCert(PATH_TO_DEV_PRIVATE_KEY);
            options.cert =  getCert( PATH_TO_DEV_CERTIFICATE,);
            break;

        case 'prod': 
            options.key = getCert( PATH_TO_PROD_PRIVATE_KEY,);
            options.cert =  getCert(  PATH_TO_PROD_CERTIFICATE);
            break;
    }

    return options;    
}


function getCert(pathToKey:string):Buffer { 
    return fs.readFileSync( path.join ( appRoot.path.toString(), pathToKey));
}

/****
 * On Listening: called when our express app has inittialzied
 */
function onListening():void {

    let addr = server.address();
    let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
    console.error(`Listening on ${bind}`);

   /*****
    * BOOTSTRAP APPLICATION  
    */    
}


/***
 * Create server instance
 */
function createServer():void {

    /**
     * Create HTTPS server.
     */
    if(EXPRESS_SERVER_MODE==='https') {        
        let options:ServerOptions = getSSL();
        server = https.createServer(options, App);

    /**
     * Create HTTP server.
     */
    } else if(EXPRESS_SERVER_MODE==='http') {       
        server = http.createServer(App);
    }

    /**
     * Listen on provided port, on all network interfaces.
     */
    server.listen(PORT);
    server.on('error', onError);
    server.on('listening', onListening); 
}



/**
 * Bootstap Application: Development Environment
 */
if(env=='dev') { 

	createServer();

/**
 * Bootstap Application: Production Environment
 * Do not use this option until release 1.0 => REDIS Caching
 */
} else if(env=='prod') {

    let workerRestartCounter:number = 0;

    /* Handle multi-core systems with cluster */
    cluster = require('cluster');

    if(cluster.isMaster) {

        // Count the machine's CPUs
        let cpuCount:number = require('os').cpus().length;

        // Create a worker for each CPU   
        // limited until release 2.0    

        let limiterCPU:number = 1;
        for (var i = 0; i < limiterCPU; i += 1) {
            setCluster(i);                   
        };

        // Listen for dying workers: Replace the dead worker
        cluster.on('exit', function(deadWorker:any, code:any, signal:any) {   

             // Restart the worker
            if(workerRestartCounter < 3 ) {
                
                var worker = cluster.fork();

                 workerRestartCounter++;

                /* Note the process IDs
                 * And assign worker PID (Process ID) to global so it can be processed
                 * in any shared queue (for instance images)
                 */
                var newPID = worker.process.pid;
                var oldPID = deadWorker.process.pid;                         
                myGlobal.workerID = worker.process.pid;     

                // #TODO: Log error
                console.error("App worker " + deadWorker.process.pid + " died. New worker "+worker.process.pid +" is launched.");            
                process.exit(1);

            } else {
                // 
                console.error("TCAA Application has crashed. Please check application error log.");            
            }                     
                        
        });  

         /* Log stack trace on worker dead */
        process.on('uncaughtException', (err) => {
            let d:string = (new Date).toUTCString();
            let message:string = `S{d} - uncaughtException ${err.message}`;
            let stack = err.stack;
            // #TODO : log error          
        });

    /***
     * Cluster is current worker
     */
    } else {        

        /**
         * ALIAS WORKER 
         */
        myGlobal.workerID = cluster.worker.id;

        /**
         * Creatse New Server
         */
        createServer();
    } 
} 

