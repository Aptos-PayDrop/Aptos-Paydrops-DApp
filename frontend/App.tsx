import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
// Internal pages
import { ClaimPaydrops } from "@/pages/ClaimPaydrops";
import { CreateDropTree } from "@/pages/CreateDropTree";
import { MyHistory } from "@/pages/DropsHistory";
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
        path: "history",
        element: <MyHistory />,
      },
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
