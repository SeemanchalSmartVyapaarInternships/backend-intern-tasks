/**
 * Wraps an async route handler / middleware so that any rejected promise
 * (thrown error) is automatically forwarded to Express's error handling
 * middleware via next(err), removing the need for repetitive try/catch
 * blocks in every controller.
 *
 * Usage:
 *   router.get('/route', catchAsync(async (req, res) => { ... }));
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
