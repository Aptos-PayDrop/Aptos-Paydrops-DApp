import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
// Internal pages
import { ClaimPaydrops } from "@/pages/ClaimPaydrops";
import { CreateDropTree } from "@/pages/CreateDropTree";
import { MyHistory } from "@/pages/DropsHistory";
import { MyDropTrees } from "./pages/MyDroptrees";
import { DropTreeByRoot } from "./pages/DropTreeByRoot";
import { NotFound } from "./pages/NotFound";
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
    errorElement: <NotFound />,
    children: [
      {
        errorElement: <NotFound />,
        path: "/",
        element: <ClaimPaydrops />,
      },
      {
        errorElement: <NotFound />,
        path: "create-droptree",
        element: <CreateDropTree />,
      },
      {
        errorElement: <NotFound />,
        path: "claim-history",
        element: <MyHistory />,
      },
      {
        errorElement: <NotFound />,
        path: "droptree-history",
        element: <MyDropTrees />
      },
      {
        path: "droptree/:tree",
        errorElement: <NotFound />,
        element: <DropTreeByRoot />,

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
