import { asyncHandler } from "../utils/AsyncHandler"
import { Apiresponse } from "../utils/APIResponse"


const healthcheck = asyncHandler(async (req, res) => {
    // Build healthcheck response
    const healthcheckData = {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: "Service is running smoothly"
    }

    return res.status(200).json(
        new Apiresponse(200, healthcheckData, "Healthcheck completed successfully")
    )
})

export {
    healthcheck
}