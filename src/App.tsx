import React, { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid as Grid } from "react-window";

import "./App.css";
import { useDefinition, useDefinitions } from "./populateDefinitions";

const Cell = ({
  columnIndex,
  rowIndex,
  style,
  data: { counts, rowCount, columnCount },
}: any) => {
  const index = columnCount * rowIndex + columnIndex;

  const [tableName, tableIndex] = useMemo(() => {
    let acc = 0;

    for (const [tableName, tableCount] of counts) {
      const newAcc = acc + tableCount;

      if (index > newAcc) {
        acc = newAcc;
      } else {
        const remainingIndex = index - acc;
        return [tableName as string, remainingIndex] as const;
      }
    }

    return ["unknown", -1] as const;
  }, [index, counts]);

  const prettyTableName = useMemo(
    () => tableName?.match(/Destiny(\w+)Definition/)?.[1],
    [tableName]
  );

  const [definition, loaded] = useDefinition(tableName, tableIndex) ?? {};

  return (
    <div
      className={
        columnIndex % 2
          ? rowIndex % 2 === 0
            ? "GridItemOdd"
            : "GridItemEven"
          : rowIndex % 2
          ? "GridItemOdd"
          : "GridItemEven"
      }
      style={style}
    >
      {prettyTableName} {tableIndex}
      <br />
      {loaded ? (
        definition ? (
          <div>
            <img
              loading="lazy"
              className="item-icon"
              alt=""
              src={`https://www.bungie.net${definition.displayProperties?.icon}`}
            />{" "}
            {definition.displayProperties?.name}
          </div>
        ) : (
          <em>unable to load definition</em>
        )
      ) : (
        <em>loading...</em>
      )}
    </div>
  );
};

// function useBodyWith() {
//   const [width, setWidth] = useState(() => document.body.clientWidth);

//   useEffect(() => {
//     function listener() {
//       setWidth(document.body.clientWidth);
//     }

//     document.body.addEventListener("resize", listener);

//     return () => document.body.removeEventListener("resize", listener);
//   }, []);

//   return width;
// }

const COLUMN_WIDTH = 200;

function ResponsiveGrid({ width, height }: { width: number; height: number }) {
  const defCounts = useDefinitions();

  const totalDefsCount = useMemo(() => {
    return defCounts.reduce((acc, item) => {
      return acc + item[1];
    }, 0);
  }, [defCounts]);

  const columnCount = Math.floor(width / COLUMN_WIDTH);
  const columnSize = width / columnCount;

  const rowCount = Math.floor(totalDefsCount / columnCount);

  return (
    <>
      <Grid
        className="Grid"
        columnCount={columnCount}
        columnWidth={columnSize}
        itemData={{ counts: defCounts, rowCount, columnCount }}
        height={height}
        rowCount={rowCount}
        rowHeight={75}
        width={width}
      >
        {Cell}
      </Grid>
    </>
  );
}

const Example = () => {
  // const windowWidth = useBodyWith();

  return (
    <>
      <AutoSizer>
        {({ height, width }) => {
          return <ResponsiveGrid height={height} width={width} />;
        }}
      </AutoSizer>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <Example />
    </div>
  );
}

export default App;
