"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  ChevronDown,
} from "lucide-react";

import ScrollReveal from "../../../../components/ScrollReveal";

import en from "../../../../dictionaries/en.json";
import id from "../../../../dictionaries/id.json";
import { sanitizeHtml } from "@/lib/sanitize";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";


const BACKEND_ORIGIN =
  API_URL.replace(/\/api\/v1\/?$/, "");



const fallbackImages = [
  "/asset.jpeg",     // Layanan 1
  "/service2.webp",  // Layanan 2
  "/asset3.jpg",     // Layanan 3
  "/service.jpg",    // Layanan 4
  "/service3.jpg",   // Layanan 5
];



type Article = {
  id:number;
  category:string;
  title:string;
  slug:string;
  content:string;
  status:string;
  image_url?:string|null;
};



type ServiceItem = {
  id:number;
  title:string;
  desc:string;
  descHtml:string;
  scopes:string[];
  image_url?:string|null;
};





function resolveImageUrl(
  url?:string|null,
  fallback?:string
){

  if(!url) return fallback || "";

  if(url.startsWith("http"))
    return url;

  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;

}





function stripHtml(html:string){

  return html
    .replace(/<[^>]+>/g," ")
    .replace(/&nbsp;/g," ")
    .replace(/&amp;/g,"&")
    .replace(/\s+/g," ")
    .trim();

}





function parseContent(content:string){

  if(!content)
    return {
      desc:"",
      descHtml:"",
      scopes:[]
    };


  const isHtml =
    /<\/?[a-z][\s\S]*>/i.test(content);



  if(isHtml){

    const scopes:string[]=[];

    const regex =
      /<li[^>]*>([\s\S]*?)<\/li>/gi;


    let match;


    while(
      (match = regex.exec(content)) !== null
    ){

      const text =
        stripHtml(match[1]);

      if(text)
        scopes.push(text);

    }



    const withoutList =
      content
      .replace(/<ul[\s\S]*?<\/ul>/gi,"")
      .replace(/<ol[\s\S]*?<\/ol>/gi,"");


    return {

      desc:
        stripHtml(withoutList),

      descHtml:
        withoutList.trim(),

      scopes,

    };

  }




  const lines =
    content
    .split("\n")
    .map(x=>x.trim())
    .filter(Boolean);



  const scopes =
    lines
    .filter(
      x =>
        x.startsWith("-") ||
        x.startsWith("•") ||
        x.startsWith("*")
    )
    .map(
      x =>
        x.replace(/^[-•*]\s*/,"")
    );



  const desc =
    lines
    .filter(
      x =>
        !x.startsWith("-") &&
        !x.startsWith("•") &&
        !x.startsWith("*")
    )
    .join(" ");



  return {
    desc,
    descHtml:"",
    scopes
  };

}





function Description({
  desc,
  descHtml
}:{
  desc:string;
  descHtml:string;
}){


  if(descHtml){

    return (

      <div
        className="
        prose
        prose-emerald
        max-w-none
        prose-p:my-0
        prose-p:leading-relaxed
        line-clamp-3
        "
        dangerouslySetInnerHTML={{
          __html:sanitizeHtml(descHtml)
        }}
      />

    );

  }



  return (

    <p className="
      text-slate-600
      leading-relaxed
      text-[15px]
      font-medium
      line-clamp-3
    ">

      {desc}

    </p>

  );

}








function ServiceCard({
  service,
  index,
  scopeLabel,
  getImage,
}: {
  service: ServiceItem;
  index: number;
  scopeLabel: string;
  getImage: (item: ServiceItem, index: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const defaultImg = fallbackImages[index % fallbackImages.length];

  return (
    <ScrollReveal
      delay={`delay-${Math.min(index * 100, 300)}`}
      className="w-full"
    >
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden group hover:border-emerald-200 hover:shadow-[0_25px_60px_-20px_rgba(16,185,129,0.18)] transition-all duration-500">
        
        {/* CONTAINER GAMBAR */}
        <div className="aspect-[16/10] overflow-hidden relative bg-slate-100">
          <img
            src={getImage(service, index)}
            alt={service.title}
            onError={(e) => {
              if (e.currentTarget.src !== window.location.origin + defaultImg) {
                e.currentTarget.src = defaultImg;
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
        </div>

        <div className="px-6 pt-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-black tracking-[0.3em] text-emerald-600">
              0{index + 1}
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <h3 className="text-xl md:text-2xl font-extrabold text-emerald-950 leading-snug tracking-tight mb-4 group-hover:text-emerald-700 transition">
            {service.title}
          </h3>

          <div className="mb-6">
            <Description desc={service.desc} descHtml={service.descHtml} />
          </div>

          {service.scopes.length > 0 && (
            <div className="border-t border-slate-100 pt-5 pb-6">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">
                  {scopeLabel}
                </span>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                    open
                      ? "bg-emerald-100 text-emerald-700 rotate-180"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <div
                className={`grid transition-all duration-500 ${
                  open
                    ? "grid-rows-[1fr] opacity-100 mt-5"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="space-y-4">
                    {service.scopes.map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                        <span className="text-sm text-slate-600 font-semibold leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}









export default function ServicesPage(){


const params = useParams();


const lang =
(params?.lang as string) || "en";


const dict =
lang==="id"
?
id
:
en;



const t =
(dict as any).services || {};



const [services,setServices]=useState<ServiceItem[]>([]);

const [loading,setLoading]=useState(true);





useEffect(()=>{


async function load(){


try{


const res =
await fetch(
`${API_URL}/articles/?lang=${lang}`
);



const data =
await res.json();



const list:Article[] =
Array.isArray(data)
?
data
:
[];




const filtered =
list.filter(
x =>
x.category==="services" &&
x.status==="published"
);




setServices(

filtered.map(item=>{


const parsed =
parseContent(item.content);


return {

id:item.id,

title:item.title,

desc:parsed.desc,

descHtml:parsed.descHtml,

scopes:parsed.scopes,

image_url:item.image_url

};


})

);



}
catch{

setServices([]);

}
finally{

setLoading(false);

}


}



load();


},[lang]);







const getImage =
(
item:ServiceItem,
index:number
)=>

resolveImageUrl(
item.image_url,
fallbackImages[
index % fallbackImages.length
]
);





return (

<main className="
min-h-screen
bg-slate-50
overflow-hidden
relative
pb-28
">


<div className="
absolute
top-0
left-1/2
-translate-x-1/2
w-[700px]
h-[500px]
bg-emerald-100/40
rounded-full
blur-[160px]
"/>





<div className="
relative
max-w-[1400px]
mx-auto
px-6
lg:px-12
pt-28
md:pt-36
">






<ScrollReveal>


<div className="
max-w-4xl
mx-auto
text-center
mb-16
">


<p className="
text-xs
uppercase
tracking-[0.3em]
font-bold
text-emerald-600
mb-8
">

{t.eyebrow ||
(lang==="id"
?
"Pilar Keberlanjutan"
:
"Sustainability Pillars"
)}

</p>




<h1 className="
text-4xl
md:text-6xl
lg:text-7xl
font-extrabold
text-emerald-950
leading-tight
">

{t.title ||
(lang==="id"
?
"Layanan"
:
"Our"
)}

{" "}

<span className="
font-serif
italic
font-light
text-emerald-600
">

{t.title_highlight ||
(lang==="id"
?
"Unggulan"
:
"Services"
)}

</span>


</h1>





<p className="
mt-6
text-lg
md:text-xl
text-slate-500
leading-relaxed
max-w-3xl
mx-auto
">

{t.subtitle ||
"Core sustainability services integrating science and data."
}

</p>



</div>


</ScrollReveal>







{
loading
?

<div className="
flex
justify-center
py-20
">

<div className="
w-10
h-10
rounded-full
border-4
border-slate-200
border-t-emerald-600
animate-spin
"/>

</div>


:


<div className="
grid
md:grid-cols-2
lg:grid-cols-3
gap-8
">

{
services.map(
(service,index)=>(

<ServiceCard

key={service.id}

service={service}

index={index}

scopeLabel={
t.scope_label ||
"Scope of Work"
}

getImage={getImage}

/>

))
}

</div>


}



</div>


</main>

);


}