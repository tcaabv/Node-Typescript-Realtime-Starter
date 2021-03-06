import path from "path";
import passport from "passport";
import passportLocal from "passport-local";
import passportFacebook from "passport-facebook";

/******
 * Import Authenticatoin Settings
 */
import {
	ENABLE_GOOGLE_AUTHENTICATION,
	GOOGLE_AUTH_ID,
	GOOGLE_AUTH_SECRET,
	GOOGLE_CALLBACK_URL,
	ENABLE_FACEBOOK_AUTHENTICATION,
	FACEBOOK_ID, 
	FACEBOOK_SECRET,
	FACEBOOK_CALLBACK_URL
} from '../../util/secrets';

import { GoogleUserService, FaceBookUserService } from "../../services";
import { IUser} from "../interfaces";

/******
 * Degine Authentication Strategies
 */
const FacebookStrategy = passportFacebook.Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const google = new GoogleUserService();
const fb = new FaceBookUserService();


/**************************************************************************************************
 *  Configure the Google strategy for usage with Passport.js.
 *
 *	OAuth 2-based strategies require a `verify` function which receives the
 *	credential (`accessToken`) for accessing the Google API on the user's behalf,
 *	along with the user's profile. The function must invoke `cb` with a user
 *	object, which will be set at `req.user` in route handlers after authentication.
 *
 */
passport.use(new GoogleStrategy({
	clientID: GOOGLE_AUTH_ID,
	clientSecret: GOOGLE_AUTH_SECRET,
	callbackURL: GOOGLE_CALLBACK_URL,
	accessType: 'offline',
	proxy:true
}, (accessToken:any, refreshToken:any, profile:any, done:Function) => {		

		google.authenticateGoogleUser(
			accessToken,
			refreshToken,
			profile
		)
		.then( (user:any) => { return done(null, user);  })
		.catch( (err:Error) => { return done(err); })				
		
	}) 
);  

/**************************************************************************************************
 *  Configure the Facebook strategy for usage with Passport.js.
 * To implement Facebook Login with the following steps:
 *
 * (1) Enter Your Redirect URL to take people to your successful-login page.
 * (2) Check the login status to see if someone's already logged into your app. During this step, you should also check to see if someone has previously logged into your app, but is not currently logged in.
 * (3) Log people in, either with the login button or with the login dialog, and ask for a set of data permissions.
 * (4) Log people out to allow them to exit from your app.
 */

passport.use( new FacebookStrategy({
	clientID: FACEBOOK_ID,
  	clientSecret: FACEBOOK_SECRET,
  	callbackURL: FACEBOOK_CALLBACK_URL,
  	profileFields: ["name", "email", "link", "locale", "timezone", "picture"],
  	passReqToCallback: true
}, (req: any, accessToken:any, refreshToken:any, profile:any, done:any) => {	

	fb.authenticateFacebookUser( accessToken, profile)
	.then( (user:any) => { return done(null, user);  })
	.catch( (err:Error) => { return done(err); })		


}));


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});