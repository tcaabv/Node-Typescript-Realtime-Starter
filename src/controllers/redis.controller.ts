import redis from "redis";
import util from "util";

import {
	USE_LOCAL_REDIS_SERVER,
	REDIS_LOCAL_URL,
	REDIS_LOCAL_PORT

} from "../util/secrets";

export class RedisController  {	

	constructor() {
	}

	static localURL():string {
		return `${REDIS_LOCAL_URL}:${REDIS_LOCAL_PORT}`;
	}

	/***
	 * Set up Connection with Local Redis Server
	 */
	static async buildLocal() {				

		try {

			if(!USE_LOCAL_REDIS_SERVER)
				return Promise.resolve();

			const url:string = this.localURL();

			/***
			 * Create Redis client
			 */
			const client:any = redis.createClient(url);		

			/***
			 * Promisify Redis Client
			 */
			client.get = util.promisify(client.get);

			/****
			 * eturn Redis CLient to Bootstrap Controller
			 */
			return Promise.resolve(client);


		} catch(e) {

			console.error("Redis Server Error: please check your configuration settings for Redis - could not connect")
			process.exit(1)
		}
	}
}