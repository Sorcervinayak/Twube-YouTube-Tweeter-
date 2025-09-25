class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong!!",
        errors = [],
        stack = ""
    ) {
        super(message); // call Error constructor
        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack; // custom stack if provided
        } else {
            Error.captureStackTrace(this, this.constructor); // auto-generate stack trace
        }
    }
}

export {ApiError}