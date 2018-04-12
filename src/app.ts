import path from 'path';
import express from 'express';
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import logger from "morgan";
import passport from "passport";

// import passport for authentication support
require("./shared/auth-strategies/passport");

/***
 * Router Controllers
 */
import UserRouter from './routers/user.router';

import { shouldCompress } from './util/middleware.util';

/***
 * Axios Configuration
 */
import axios from "./util/axios";

import {u} from "./services/user.service";

/*****
 * Test ground
 */

/*
import { populateDatabase} from "./services/data.service";
populateDatabase();
*/


class App {

    // ref tot Express instance
    public express: express.Application;

    constructor() {   

        // create router app with express
        this.express  = express();
        this.initPassPort();
        this.middleware();
        this.routes();    
    }   

    private initPassPort():void {
        this.express.use(passport.initialize());
    }

    private middleware():void {       

        /***
         * secure your Express apps by setting various HTTP headers
         * info: https://www.npmjs.com/package/helmet
         */
        this.express.use(helmet() );

         /***
         * Compress server output, supported types
         * @deflate
         * @gzip (default)
         */
        this.express.use(compression({
            filter: shouldCompress
        }));

        /***
         * Cookie-parser: Parse Cookie header and populate req.cookies with an object keyed by the cookie names. 
         * https://www.npmjs.com/package/cookie-parser
         */
        this.express.use(cookieParser());

        /***
         * Body-parser: Parse incoming request bodies in a middleware before your handlers, available under the req.body property (post requesst).
         * https://www.npmjs.com/package/body-parser
         */
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));

        /***
         * Sample logging engine: Morgan
         * https://www.npmjs.com/package/morgan
         */
        this.express.use(logger('dev'));
    }

    private routes():void {

        /***
         * User API
         */
        this.express.use('/api/user', UserRouter);

    }
}

export default new App().express;




