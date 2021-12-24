import createSource from "./createSource";
import process from "./process";

const source = createSource(process);

source.addActionListener("update", (ds) => {
  console.log("查询的数据:", ds);
});

source.dispatch({
  type: "update",
  payload: "新的名称",
});

const dp = source.makeDispatch({});
