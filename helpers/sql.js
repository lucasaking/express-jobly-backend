const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/* sqlForPartialUpdate takes two inputs:
      dataToUpdate: object with fields and values which needs an update
      jsToSql: object mapper with cameCase case to sql case (ex: { numEmployees: "num_employees"})
Returns: javascript camelCase to SQL format
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  
  // Map the columns to their respective paramaterized query strings 
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  
  /* Return updated data with this format...
     setCols: '"name"=$1, "num_employees"=$2', 
     values: ["c2-NEW", 20] */ 
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
