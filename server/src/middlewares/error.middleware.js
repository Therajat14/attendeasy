// Express recognises an error handler by its four parameters, so `next` has to
// stay in the list even though we do not use it.
export const errorHandler = (error, req, res, next) => {
  console.error("ERROR", error.message);
  console.error(error.stack);

  return res.status(500).json({ message: "Something went wrong on our side" });
};
