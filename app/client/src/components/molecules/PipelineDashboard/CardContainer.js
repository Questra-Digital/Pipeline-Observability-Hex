import Card from "./Card";

function CardContainer({ data }) {
  // Check if data exists
  const keys = data && typeof data === "object" ? Object.keys(data) : [];

  // STATIC DESIGN DATA (Matched to your specific keys)
  // Since your keys seem to be [Pod, Service, Deployment, ReplicaSet]
  // We align these arrays to match that order.
  
  const subtitles = [
    "Orchestration Status", // For Pod
    "Network Connectivity", // For Service
    "Rolling Updates",      // For Deployment
    "Scaling Configuration" // For ReplicaSet
  ];

  const badges = [
    "K8S CLUSTER",
    "NETWORKING",
    "CI/CD PIPE",
    "SCALING"
  ];

  return (
    // Changed layout to GRID for perfect alignment
    <div className="w-full p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 justify-items-center">
        {keys.map((key, index) => (
            <Card
            key={index}
            title={key} 
            number={data[key]} // Your backend data (e.g. "Healthy")
            badgeText={badges[index] || "SYSTEM"} 
            subtitle={subtitles[index] || "System operational"}
            />
        ))}
        </div>
    </div>
  );
}

export default CardContainer;