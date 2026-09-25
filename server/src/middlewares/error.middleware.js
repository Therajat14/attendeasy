export const errorHandler = (err, req, res, next) => {
  console.error("ERROR", err.message);
  console.error(err.stack);

  res.status(500).json({ message: "Something went wrong on our side" });
};
