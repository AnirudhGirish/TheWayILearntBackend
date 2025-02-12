class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "")
    {
        super(message); // Call parent class constructor with the message
        this.statusCode = statusCode;
        this.message = message;
        this.data = null;
        this.success = false; // Indicates this is an error response
        this.errors = errors;
        
        if(stack){
            this.stack = stack;
        }else {
            Error.captureStackTrace(this,this.constructor);
        }
        //this.stack = stack || (new Error()).stack;  this is can aslo be used in place of above if else..
    }
}

export { ApiError } 