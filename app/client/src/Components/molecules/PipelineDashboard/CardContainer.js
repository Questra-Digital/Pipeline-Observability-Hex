import Card from "./Card";

function CardContainer({ data }) {
  // Check if data exists and is an object before extracting keys
  const keys = data && typeof data === "object" ? Object.keys(data) : [];
  console.log("Data in Container :  ", data);

  const colors = [
    { leftColor: "#8B2BE2", rightColor: "#5F15E2", betweenColor: "#6C17E1" },
    { leftColor: "#8700FF", rightColor: "#D911FF", betweenColor: "#A900FF" },
    { leftColor: "#8C2CE2", rightColor: "#4F03E0", betweenColor: "#711AE1" },
    { leftColor: "#F403CA", rightColor: "#422F9D", betweenColor: "#A417B5" },
  ];

  const imagesURLs = [
    "/assets/Images/pod.png",
    "/assets/Images/svc.png",
    "/assets/Images/deploy.png",
    "/assets/Images/rs.png",
  ];

  return (
    <div className="flex flex-wrap flex-grow justify-between lg:justify-evenly items-center">
      {keys.map((key, index) => (
        <Card
          key={index}
          title={key}
          status={data[key]}
          colors={colors[index]}
          imageURL={imagesURLs[index]}
        />
      ))}
    </div>
  );
}

export default CardContainer;
