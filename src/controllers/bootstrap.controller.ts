import { Observable, Subscription } from "rxjs";

import { UAController, DAController } from "../controllers";;
import { proxyService, connectToUserDatabase, connectToProductDatabase } from "../services";
import { configureDatabases } from "../services/db/db.admin.service";
import { testForSystemUser, createSystemUser } from "../services/user/system.user.service";

import {
	DATA_GENERATE
} from "./actions";

import {
	privateDirectoryManager,
	publicDirectoryManager	
} from "../util";

/****
 * Init Default DB Model before import bootstrap manager
 * so it can listen to application events
 */
import { DefaultModel } from "../shared/models";
import { IEncryption} from "../shared/interfaces"



export class BootstrapController {

	userDBLive:boolean;
	productDBLive:boolean;
	testMode:boolean;

	uaController:Function;
	daController:Function;

	constructor() {
		this.configureSubscribers();
		this.dataGenerator();
	}

	private configureSubscribers():void {	

		/***
		 * Server signals that app runs in test mode
		 */
		proxyService.testMode$.subscribe( (state:boolean) => this.testMode = state );

		/***
		 * Data Generation is seperated from application boot sequence
		 * Wait for UserDB and Product DB are live to start data generaton process
		 */	
		proxyService.userDBLive$.subscribe( (state:boolean) => this.userDBLive = state );
		proxyService.productDBLive$.subscribe( (state:boolean) => this.productDBLive = state );		
	}

	/***
	 * Launch Data Generator when
	 * (1) User Database is live
	 * (2) Product Dataabse is live
	 * (3) User Action Controller is loaded
	 * (4) Data Action Controller is loaded
	 * (3) Application is not running is test mode
	 */
	private dataGenerator() {
		const source$:Observable<number> = Observable.interval(75);
		const sub$:Subscription = source$.subscribe(	
			(x:number)=> { 
				if(this.testMode || (this.userDBLive && this.productDBLive && this.uaController && this.daController) ) sub$.unsubscribe();
				if(this.userDBLive && this.productDBLive  && this.uaController && this.daController) {
					console.log("SIGNAL SIGNAL SIGNAL")
					proxyService.startDataOperations();
				}			
			}
		);
	}

	private err(err:any) {
		console.error("Critical Error: bootstrap sequence failed ")
		console.error(err);
		process.exit(1);
	}

	/****
	 * Instatiate Default DB Model 
	 * so that it can subscribe to DB events
	 */
	private initDefaultDatabaseModel() {

		let err:any;
		try { const model = new DefaultModel();} 
		catch(e) { err = e; }
		finally { if(err) this.err(err); return; }
	}

	/****
	 * Configure Databases sequence 
	 * (1) configure MongoDB Client
	 * (2) evaluate existing datbases
	 * (3) evaluate pre-defined user roles
	 * (4) evaluate pre-defined db users
	 * (5) publish db connections to default DB Model
	 * (6) default DB Model injects connections into:
	 * 		(a) SystemUSerModel		-  readWrite native connection
	 * 		(b) UserModel 			-  readWrite native connection
	 * 		(c) ClientModel			-  readWrite native connection
	 *		(d) CustomerModel		-  readWrite native connection
	 */
	private async configureDatabases():Promise<void> {		
		
		let err:any;
		try {
			const $dbConfig = await configureDatabases();
		}
		catch(e) { err=e;}
		finally {
			if(err) { 
				this.err(err); 
			} else { 
				return Promise.resolve(); 
			}
		}
	}

	/****
	 * Configure Infrastructure
	 * (1) private folders
	 * (2) public folders
	 */
	private async configureInfrastructure():Promise<void> {

		let err;
		try {
			const $private = await privateDirectoryManager();
			const $public = await publicDirectoryManager();
		}
		catch(e) { err=e;}
		finally {
			if(err) {
			 	this.err(err); 
			 } else { 
			 	return Promise.resolve(); 
			}
		}
	}
 
	/***
	 * Test if Super Admin system User
	 * Clone of MongoDB SuperAdmin, injected into <systemusers> collection
	 */
	private async systemUser():Promise<void> {		
		let err;
		try {
			const $systemUser = await testForSystemUser();
		}
		catch(e) { err=e;}
		finally {
			if(err) { this.err(err); } else { return Promise.resolve();}
		}
	}	

	async init() {	

		try {
			
			/***
			 * Test build of User Action Controller Proxy
			 */
			this.uaController = await UAController.build();			

			/****
			 * Test build of Data Action Controller Proxy
			 */
			this.daController = await DAController.build();

			/***
			 * Propagate instance of User Action Controller
			 */
			await proxyService.setUAController(this.uaController);

			/***
			 * Propagate insatnce of Data Action Controller
			 */			
			console.log("*** Bootstrap COntroller: signal DAController")
			await proxyService.setDAController(this.daController);

			/***
			 * Init Default DB Model
			 */
			await this.initDefaultDatabaseModel();

			/***
			 * Configure application databases
			 * (1) Test for predefined db users
			 * (2) Test assigned roles per db user
			 * (3) Test if predefined collections exist (#TODO)
			 * (4) Perform test operations (#TODO)
			 */		
			await this.configureDatabases();

			/***
			 * Configure infrastructure
			 * (1) Public Directories
			 * (2) Private Directories
			 * (3) Local Store Directories
			 */
			await this.configureInfrastructure();

			/***
			 * Connect To User DB
			 */
			await connectToUserDatabase();

			/***
			 * Connect to Product DB
			 */ 
			await connectToProductDatabase();		

			// process thick: 
			await createSystemUser();		

			console.log("==> Bootstrap Sequence finished")

			return Promise.resolve();

		}

		catch(e) {
			this.err(e);
		}

	}
}

export const bootstrapController = new BootstrapController();
