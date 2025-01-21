import { Socials } from "./Socials";


export function Footer(){
    return  <footer className="footer-container px-4 pb-6 w-full max-w-screen-xl mx-auto mt-6 md:mt-16 flex items-center justify-between">
          <p>PayDrops </p>
          <Socials />
        </footer>
}