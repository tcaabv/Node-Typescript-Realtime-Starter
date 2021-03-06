import { Document } from "mongoose";

import { IPerson } from "./person.interface";
import { IPaymentMethod} from "./payment.method.interface";

export interface ICustomer extends IPerson {

	// unique identifier method
	customer:Function,	

	customerPaymentMethods: {

		/*****
		 * Preferred paymet method
		 * (1) credit card
		 * (2) payment service ( PayPal, Stripe, .....)
		 * (3) other
		 */
		preferredMethod?:number,

		/*****
		 * Payment Methods
		 */
		paymentMethods?:IPaymentMethod[]

	},






}
