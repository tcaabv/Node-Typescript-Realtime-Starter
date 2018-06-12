import Promise from "bluebird";
import mongoose from "mongoose";

import { proxyService } from "../../services";
import { DefaultModel} from "./default.model";
import { ISystemUser } from "../interfaces";
import { ReadWriteRepositoryBase } from "../../engines";
import { TSYSTEMUSER } from "../types";

/***
 * Local Repository that contains all methods for 
 * local instance of MongoDB
 */

class SystemUserRepository extends ReadWriteRepositoryBase<ISystemUser> {
	
	constructor(connection:mongoose.Model<mongoose.Document>) {
		super( 'SystemUser', connection);
	}
}

/*****
 * Model extends Default Model which provides support for external MpngoDB Providers
 */
export class SystemUserModel extends DefaultModel  {

	private _systemUserModel: ISystemUser;

	constructor(systemUserModel: ISystemUser) {

		/****
		 * Call Parent Constructor
		 */
		super();

		this._systemUserModel = systemUserModel;		

		proxyService.userDBLive$.subscribe( (state:boolean) => {						
			if(proxyService.userDB) this.userDBConn = proxyService.userDB;				
			this.repo = new SystemUserRepository( this.userDBConn );
		});		
	}			

	/****
	 * Define custom methods for local onstance of MongoDB here	
	 */
	public createUser(user:ISystemUser): Promise<any> {			
		const repo = new SystemUserRepository( this.userDBConn );		
		return new Promise ( (resolve, reject) => {
			repo.create(user, (err:any, res:any) => {			
				if(err) { reject(err);} else { resolve(res);}
			});
		});
	}	

}

export const systemUserModel = new SystemUserModel(TSYSTEMUSER);


