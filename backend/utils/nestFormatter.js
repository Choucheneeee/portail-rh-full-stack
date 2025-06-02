const nestFormatter = (req, res, next) => {
  const nestedBody = {};
  
  // Convert flat keys to nested structure
  Object.keys(req.body).forEach(key => {
    if (key.includes('.')) {
      const keys = key.split('.');
      let current = nestedBody;
      
      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          current[k] = req.body[key];
        } else {
          current[k] = current[k] || {};
          current = current[k];
        }
      });
    } else {
      nestedBody[key] = req.body[key];
    }
  });
  
  req.body = nestedBody;
  next();
};

module.exports = nestFormatter;