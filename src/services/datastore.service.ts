import fs from "fs-extra";
import Promise from "bluebird";
import path from "path";

const jsonFile:any = Promise.promisifyAll(require('jsonfile'));

import { 
	IUser, 
	IClient, 
	ICustomer
} from "../shared/interfaces";

import {
	getPathToDataStore
} from "../util";

interface IData {
	users?: {
		superadmin?: IUser[],
		admin: IUser[],
		poweruser: IUser[],
		author: IUser[],
		user: IUser[]
	},
	defaultClient?: IClient[],
	defaultCustomer?: ICustomer[]
}


export class DataStore {

	/********
	 * Store generated data in data store folders, location @dataStore
	 * @dataStore = PRIVATE_DATA_DIR
	 */
	static storeDataLocally(data:IData) {
		
		const $stores:string[]=["1","2","3"];
		const $dataStore:string = getPathToDataStore();
		return Promise.all(
			$stores.map( (store:string) => {			
				let pathToFile:string = `${path.join($dataStore,store)}\\data.json`;				
				jsonFile.writeFile( pathToFile, data, {spaces:1}, (err:any) => {															
					(err)? Promise.reject(err):Promise.resolve();				
				});	
			})
		)
		.then( () => Promise.resolve() )
		.catch( (err:any) => {
			console.error("Local DataStore: generated data could not be saved. ", err );
			process.exit(1);
		});	

	}	

}