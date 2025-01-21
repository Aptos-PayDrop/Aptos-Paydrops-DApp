import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
// Internal pages
import { Mint } from "@/pages/Mint";
import { CreateDropTree } from "@/pages/CreateDropTree";
import { MyFungibleAssets } from "@/pages/DropsHistory";
import {Theme} from "@radix-ui/themes"
function Layout() {
  return (
    <>
      <Outlet />
    </>
  );
}

//TODO: I need a claim page, a deposit page and a deposit history page

//I need the claim page to show your past claims also I guess

//TODO: It should scan for claims

//TODO: Claims page should have input for root and sponsor

//TOOD: create fungible asset should be create droptree
//It accepts a CSV import, parses the csv and renders a page if it's not too large
//it should provide a UI to manually enter the address and amount parameters too
//then it upload the merkle tree on IRYS and interacts with the contract
//The deposit history is fetched from IRYS and displayed in a row

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Mint />,
      },
      {
        path: "create-asset",
        element: <CreateDropTree />,
      },
      {
        path: "my-assets",
        element: <MyFungibleAssets />,
      },
    ],
  },
]);

//TODO: splash screen on reload

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
