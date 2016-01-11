# Waterlock Blackboard Auth

 **THIS MODULE IS NOT CURRENTLY TESTED**

A module for [Waterlock](http://waterlock.ninja/) providing authentication using the Blackboard VLE. This was originally written for use with [Synote.js](https://github.com/yunjiali/synote.js).

## Usage
This module requires a Blackboard building block (add-on module) to be installed on the target Blackboard server. The module can be found [here](https://github.com/CrispinClark/Blackboard-Waterlock-Authentication-Building-Block). You must configure this module, assigning the Blackboard server a provider id and a shared secret key. Communications are carried out between this module and the server using Json Web Tokens that are signed using the shared secret key.

To log in, redirect users to `/auth/login?type=blackboard`.

On successful login, the following fields are added to the Auth model:
* `provider` - ID of the Blackboard server. This is set in the Blackboard building block configuration. e.g. "BlackboardServer1"
* `blackboard_id` - Username of the user on the provider e.g. "user1"
* `username` - Unique username for use in our application: provider+"\"+blackboard_id, e.g. "BlackboardServer1\user1"
* `firstname`
* `lastname`
* `email` - note that email addresses aren't unique in Blackboard

### Configuration

The module is configured in the standard waterlock.js configuration file (`/config/waterlock.js`)

```js

	authMethod: [
	    {
	        name: "waterlock-blackboard-auth",
	        service_name: "New_application_1",
	        provider: {
	          id:"BlackboardServer1",
	          name:"Test Blackboard Server",
	          secret:"secret key 1",
	          bounce:"https://blackboard.university.ac.uk/webapps/syn-waterlock-blackboard-auth-BBLEARN/SSO.jsp",
	          fieldMap:{
	            "username":"newUsername"
	          }
	        }
	    }
	]

```

* `service_name` - *(required)* The name that your application will use to identify itself with the Blackboard server.
* `provider` - *(required)* Can be a single provider or an array of providers - an array allows your application to use multiple Blackboard servers at the same time. If you make use of multiple providers, you must redirect users to `/auth/login?type=blackboard&provider=provider_id` to log in, where provider_id is the id of the provider (Blackboard server) that you wish to log the user in with.
	* `id` - *(required)* Unique ID for the Blackboard server. Must be the same as the provider id registered in the Blackboard buidling block. This is the id you assigned the server when configuring the Blackboard building block.
	* `name` - *(required)* A friendly name for the Blackboard server.
	* `secret` - *(required)* A secret key that is shared with the Blackboard server. This must be the same as the key registered in the Blackboard building block.
	* `bounce` - *(required)* The URL of the Blackboard building block page that processes the request. Can be found in the configuration page of the Blackboard building block.
	* `fieldMap` - *(optional)* In other Waterlock modules, this is used to pull aditional fields from the authentication provider. We currently add all fields to the auth object that are returned. You can use the field map to map the returned fields to different fields on your auth model. For example "username":"newUsername" will update the newUsername field in your Auth model with the value returned as "username".

## License
MIT License. Copyright © 2015 Thomas Kemp. See LICENSE file.

Structure based other [Waterlock](https://github.com/waterlock) modules.


