import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
// Internal pages
import { ClaimPaydrops } from "@/pages/ClaimPaydrops";
import { CreateDropTree } from "@/pages/CreateDropTree";
import { MyHistory } from "@/pages/DropsHistory";
import { MyDropTrees } from "./pages/MyDroptrees";
function Layout() {
  return (
    <>
      <Outlet />
    </>
  );
}



const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <ClaimPaydrops />,
      },
      {
        path: "create-droptree",
        element: <CreateDropTree />,
      },
      {
        path: "claim-history",
        element: <MyHistory />,
      },
      {
        path: "droptree-history",
        element: <MyDropTrees/>
      }
    ],
  },
]);


function App() {
  return (
    <>
      <RouterProvider router={router} />

    </>
  );
}

export default App;
