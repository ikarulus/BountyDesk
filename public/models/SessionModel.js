/**
 * @desc		stores the POST state and response state of authentication for user
 */
define([
    "app",
    "models/UserModel"
], function(app, UserModel){

    var SessionModel = Backbone.Model.extend({

        // Initialize with negative/empty defaults
        // These will be overriden after the initial checkAuth
        defaults: {
            logged_in: false,
            user_id: ''
        },

        initialize: function(){
            

            // Singleton user object
            // Access or listen on this throughout any module with app.session.user
            this.user = new UserModel({});
        },


        url: function(){
            return app.API + '/auth';
        },

        // Fxn to update user attributes after recieving API response
        updateSessionUser: function( userData ){
            this.user.set(_.pick(userData, _.keys(this.user.defaults)));
        },


        /*
         * Check for session from API 
         * The API will parse client cookies using its secret token
         * and return a user object if authenticated
         */
        checkAuth: function(callback, args) {
            var self = this;
            this.fetch({
                success: function(mod, res){
                    if(!res.error && res.user){
                        self.updateSessionUser(res.user);
                        self.set({ logged_in : true });
                        if('success' in callback) callback.success(mod, res);
                    } else {
                        self.set({ logged_in : false });
                        if('error' in callback) callback.error(mod, res);
                    }
                }, error:function(mod, res){
                    self.set({ logged_in : false });
                    if('error' in callback) callback.error(mod, res);
                }
            }).complete( function(){
                if('complete' in callback) callback.complete();
            });
        },


        /*
         * Abstracted fxn to make a POST request to the auth endpoint
         * This takes care of the CSRF header for security, as well as
         * updating the user and session after receiving an API response
         */
        postAuth: function(opts, callback, args){
            var self = this;
            var postData = _.omit(opts, 'method');
            if(DEBUG) console.log(postData);
            $.ajax({
                //url: this.url() + '/' + opts.method, -> alt, muss ggf zurück
                url: app.API+'/' + opts.method,
                contentType: 'application/json',
                dataType: 'json',
                type: 'POST',
                data:  JSON.stringify( _.omit(opts, 'method') ),
                success: function(res){

                    if( !res.error ){
                        if(opts.method=="login"){

                            self.updateSessionUser( res.user || {} );
                            self.set({ user_id: res.user.id, logged_in: true });
                        } else {
                            self.set({ logged_in: false });
                        }

                        if(callback && 'success' in callback) callback.success(res);
                    } else {
                        if(callback && 'error' in callback) callback.error(res);
                    }
                },
                error: function(mod, res, status){
                    if(callback && 'error' in callback) callback.error(status);
                }
            }).complete( function(){
                if(callback && 'complete' in callback) callback.complete(res);
            });
        },


        login: function(opts, callback, args){
            this.postAuth(_.extend(opts, { method: 'login' }), callback);
        },

        logout: function(opts, callback, args){
            this.postAuth(_.extend(opts, { method: 'logout' }), callback);
        }

    });
    
    return SessionModel;
});

