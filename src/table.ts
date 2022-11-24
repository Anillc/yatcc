export type grammar = {"terms":["+","num"],"grammars":{"G":[{"name":"G","id":1,"tokens":["E"]}],"E":[{"name":"E","id":2,"tokens":["E","+","F"]},{"name":"E","id":3,"tokens":["F"]}],"F":[{"name":"F","id":4,"tokens":["num"]}]}}

// export type producers = [{"name":"G","id":1,"tokens":["E"]},{"name":"E","id":2,"tokens":["E","+","F"]},{"name":"E","id":3,"tokens":["F"]},{"name":"F","id":4,"tokens":["num"]}]
export type producers = [null,{"name":"G","id":1,"tokens":["E"]},{"name":"E","id":2,"tokens":["E","+","F"]},{"name":"E","id":3,"tokens":["F"]},{"name":"F","id":4,"tokens":["num"]}]

export type table = {"1":{"E":[2,2],"F":[2,3],"num":[0,4]},"2":{"$":[1,1],"+":[0,5]},"3":{"$":[1,3],"+":[1,3]},"4":{"$":[1,4],"+":[1,4]},"5":{"F":[2,6],"num":[0,4]},"6":{"$":[1,2],"+":[1,2]}}