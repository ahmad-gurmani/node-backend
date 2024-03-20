// 1st way in Promise
const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}

export { asyncHandler };



// 2nd way
// these three lines to understand below code

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => {
//     async () => {}
// }

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res, status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }