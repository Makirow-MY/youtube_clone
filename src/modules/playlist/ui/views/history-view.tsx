import { HistorySection } from "../sections/history-section"


export const HistoryView = () => {
  
return(
      <div className="max-w-screen mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
        <div>
         <h1 className="text-3xl font-bold mb-6">Watch history</h1>
      </div>
           <HistorySection />
        </div>
);
}
