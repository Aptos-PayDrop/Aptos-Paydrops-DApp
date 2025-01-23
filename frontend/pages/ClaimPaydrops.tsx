import { Header } from "@/components/Header";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function ClaimPaydrops() {
  // const { data, isLoading } = useGetAssetData();

  const queryClient = useQueryClient();
  const { account } = useWallet();
  useEffect(() => {
    queryClient.invalidateQueries();
  }, [account, queryClient]);

  // if (isLoading) {
  //   return (
  //     <div className="text-center p-8">
  //       <h1 className="title-md">Loading...</h1>
  //     </div>
  //   );
  // }

  return (
    <>
      <Header title="Claim Paydrops"/>
      <div style={{ overflow: "hidden" }} className="overflow-hidden">
        <main className="flex flex-col gap-10 md:gap-16 mt-6">
          
          {/* <HeroSection /> */}
          {/* <StatsSection /> */}
          {/* <OurStorySection /> */}
        </main>

      </div>
    </>
  );
}
