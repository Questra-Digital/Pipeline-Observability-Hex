import { pieplines } from "@/constants/pipelines";

const Page = () => {
  return (
    <div className="h-full w-full p-10 overflow-x-auto">
      <table className="min-w-full text-sm text-left text-gray-400 table-auto shadow-md shadow-purple-900">
        <thead className="uppercase bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3">
              pipeline name
            </th>
            <th scope="col" className="px-6 py-3">
              Executions
            </th>
            <th scope="col" className="px-6 py-3">
              Failures
            </th>
            <th scope="col" className="px-6 py-3">
              Median
            </th>
            <th scope="col" className="px-6 py-3">
              Last Build
            </th>
          </tr>
        </thead>
        <tbody>
          {pieplines.map((pipeline, index) => (
            <tr
              className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
              key={index}
            >
              <th
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
              >
                {pipeline.name}
              </th>
              <td className="px-6 py-4">{pipeline.executions}</td>
              <td className="px-6 py-4">{pipeline.failures}</td>
              <td className="px-6 py-4">{pipeline.median}</td>
              <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md ${pipeline.last_build==="Failed" ? "bg-red-600 text-white" : "text-white bg-green-600"}`}>{pipeline.last_build}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Page;
