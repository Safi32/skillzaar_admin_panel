import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import app from "./firebase";
import { CONFIG } from "./config";

// Service icon mappings (module scope so hooks can be stable)
const SERVICE_EMOJI = {
  plumber: "🔧",
  electrician: "⚡",
  carpenter: "🪚",
  painter: "🎨",
  cleaner: "🧹",
  default: "🛠️",
};

const SERVICE_COLOR = {
  plumber: "#0ea5e9",
  electrician: "#f59e0b",
  carpenter: "#a16207",
  painter: "#db2777",
  cleaner: "#10b981",
  default: "#6b7280",
};

// Helper: detect service type from job text (module scope)
const getServiceKey = (job) => {
  const text = (job.serviceType || job.title_en || job.description_en || "")
    .toString()
    .toLowerCase();
  if (!text) return "default";
  if (text.includes("plumb")) return "plumber";
  if (
    text.includes("elect") ||
    text.includes("wire") ||
    text.includes("electric")
  )
    return "electrician";
  if (text.includes("carpenter") || text.includes("wood")) return "carpenter";
  if (text.includes("paint")) return "painter";
  if (text.includes("clean")) return "cleaner";
  return "default";
};
const createServiceIcon = (serviceKey, isAssigned) => {
  const emoji = SERVICE_EMOJI[serviceKey] || SERVICE_EMOJI.default;
  const bg = SERVICE_COLOR[serviceKey] || SERVICE_COLOR.default;
  const stroke = isAssigned ? "#b91c1c" : "#ffffff";
  const size = 48;
  const r = size / 2;
  const strokeWidth = 2;
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
      <circle cx='${r}' cy='${r}' r='${
    r - strokeWidth
  }' fill='${bg}' stroke='${stroke}' stroke-width='${strokeWidth}' />
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='22' font-family='Segoe UI Emoji,Apple Color Emoji,Segoe UI Symbol,Arial' fill='white'>${emoji}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    scaledSize:
      typeof window !== "undefined" && window.google && window.google.maps
        ? new window.google.maps.Size(size, size)
        : undefined,
    anchor:
      typeof window !== "undefined" && window.google && window.google.maps
        ? new window.google.maps.Point(size / 2, size / 2)
        : undefined,
  };
};

const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getFirestore(app);
    const jobsQuery = collection(db, "Job");

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        const allJobs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setJobs(allJobs);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching jobs:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { jobs, loading, error };
};

const useWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getFirestore(app);
    const workersQuery = collection(db, "SkilledWorkers");

    const unsubscribe = onSnapshot(
      workersQuery,
      (snapshot) => {
        const allWorkers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setWorkers(allWorkers);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching workers:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { workers, loading, error };
};

// Job Details Modal Component
const JobDetailsModal = ({
  job,
  isOpen,
  onClose,
  onAssign,
  onCancel,
  onComplete,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content job-details-modal">
        <div className="modal-header">
          <h2>Job Details</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="job-details-content">
          <div className="job-image-section">
            {job.Image && (
              <img
                src={job.Image}
                alt={job.title_en || "Job Image"}
                className="job-image"
              />
            )}
          </div>

          <div className="job-info-section">
            <h3>{job.title_en || "Job Title"}</h3>
            <p className="job-service-type">
              {job.serviceType || "Service Type"}
            </p>

            <div className="job-details-grid">
              <div className="detail-item">
                <span className="detail-label">📍 Location:</span>
                <span className="detail-value">
                  {job.Location || job.Address || "N/A"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">💰 Price:</span>
                <span className="detail-value">
                  {job.currency} {job.price || "N/A"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">📱 Poster Phone:</span>
                <span className="detail-value">{job.posterPhone || "N/A"}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">📅 Created:</span>
                <span className="detail-value">
                  {job.createdAt
                    ? new Date(
                        job.createdAt.toDate
                          ? job.createdAt.toDate()
                          : job.createdAt
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">✅ Status:</span>
                <span className={`status-badge ${job.status}`}>
                  {job.status || "N/A"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">👨‍💼 Admin Action:</span>
                <span className={`status-badge ${job.adminAction}`}>
                  {job.adminAction || "N/A"}
                </span>
              </div>
            </div>

            <div className="job-description">
              <h4>Description (English)</h4>
              <p>{job.description_en || "No description available"}</p>
            </div>

            {job.description_ur && (
              <div className="job-description">
                <h4>Description (Urdu)</h4>
                <p>{job.description_ur}</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
          {job.status === "assigned" ? (
            <div
              style={{
                padding: "10px 20px",
                background: "#f3f4f6",
                color: "#6b7280",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              Job is currently assigned
            </div>
          ) : (
            <button className="assign-btn" onClick={() => onAssign(job)}>
              Assign Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Job Assignment Modal Component
const JobAssignmentModal = ({ job, workers, isOpen, onClose, onAssign }) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  const handleAssign = () => {
    if (!selectedWorkerId) {
      console.log(job.jobPosterId);
      alert("Please select a worker to assign this job to");
      return;
    }

    const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
    if (selectedWorker) {
      onAssign(
        job.id,
        selectedWorkerId,
        selectedWorker,
        assignmentNotes,
        job.jobPosterId
      );
      onClose();
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content job-assignment-modal">
        <div className="modal-header">
          <h2>Assign Job to Worker</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="job-assignment-content">
          <div className="job-summary">
            <h3>{job.title_en || "Job Title"}</h3>
            <p>
              <strong>Service Type:</strong> {job.serviceType || "N/A"}
            </p>
            <p>
              <strong>Location:</strong> {job.Location || job.Address || "N/A"}
            </p>
            <p>
              <strong>Price:</strong> {job.currency} {job.price || "N/A"}
            </p>
          </div>

          <div className="worker-selection">
            <h4>Select Worker</h4>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="worker-select"
            >
              <option value="">Choose a worker...</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.Name ||
                    worker.displayName ||
                    worker.name ||
                    "Unknown Worker"}{" "}
                  - {worker.categories?.[0] || "General"}
                </option>
              ))}
            </select>
          </div>

          {selectedWorkerId && (
            <div className="selected-worker-details">
              {(() => {
                const selectedWorker = workers.find(
                  (w) => w.id === selectedWorkerId
                );
                return selectedWorker ? (
                  <div className="worker-card">
                    <div className="worker-info">
                      <img
                        src={
                          selectedWorker.ProfilePicture ||
                          selectedWorker.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            selectedWorker.Name || "Worker"
                          )}&background=4CAF50&color=fff&size=60&bold=true`
                        }
                        alt={selectedWorker.Name || "Worker"}
                        className="worker-avatar"
                      />
                      <div className="worker-details">
                        <h5>
                          {selectedWorker.Name ||
                            selectedWorker.displayName ||
                            selectedWorker.name ||
                            "Unknown Worker"}
                        </h5>
                        <p>
                          <strong>Phone:</strong>{" "}
                          {selectedWorker.phoneNumber ||
                            selectedWorker.phone ||
                            "N/A"}
                        </p>
                        <p>
                          <strong>City:</strong>{" "}
                          {selectedWorker.City || selectedWorker.city || "N/A"}
                        </p>
                        <p>
                          <strong>Skills:</strong>{" "}
                          {selectedWorker.categories?.join(", ") ||
                            selectedWorker.skills?.join(", ") ||
                            "N/A"}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`status-badge ${
                              selectedWorker.approvalStatus || "pending"
                            }`}
                          >
                            {selectedWorker.approvalStatus || "pending"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div className="assignment-notes">
            <h4>Assignment Notes (Optional)</h4>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Add any special instructions or notes for this assignment..."
              rows="3"
              className="notes-textarea"
            />
          </div>

          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="assign-btn" onClick={handleAssign}>
              Assign Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Map Component with Job Markers and Worker Markers
const MapComponent = ({ jobs, workers, onJobClick, onWorkerClick }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const workerMarkersRef = useRef([]);
  const connectionLineRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  // Function to draw a proper route like car pooling apps using DirectionsRenderer
  const drawConnectionLine = useCallback(
    (fromPosition, toPosition) => {
      // Remove any existing connection
      if (connectionLineRef.current) {
        connectionLineRef.current.setMap(null);
        connectionLineRef.current = null;
      }

      // Ensure DirectionsService and DirectionsRenderer instances
      if (
        !directionsServiceRef.current &&
        window.google &&
        window.google.maps
      ) {
        directionsServiceRef.current =
          new window.google.maps.DirectionsService();
      }

      if (
        !directionsRendererRef.current &&
        window.google &&
        window.google.maps
      ) {
        directionsRendererRef.current =
          new window.google.maps.DirectionsRenderer({
            suppressMarkers: true, // Don't show A/B markers, we have our own job/worker markers
            polylineOptions: {
              strokeColor: "#1976D2", // Car pooling app blue color
              strokeWeight: 8,
              strokeOpacity: 0.9,
              geodesic: false,
            },
            suppressInfoWindows: true,
            draggable: false,
            preserveViewport: true, // Don't auto-fit bounds to route
          });
      }

      const origin = { lat: fromPosition.lat(), lng: fromPosition.lng() };
      const destination = { lat: toPosition.lat(), lng: toPosition.lng() };

      // Request a driving route using DirectionsService
      if (directionsServiceRef.current && directionsRendererRef.current) {
        directionsServiceRef.current.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            drivingOptions: {
              departureTime: new Date(),
              trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
            },
            avoidHighways: false,
            avoidTolls: false,
            unitSystem: window.google.maps.UnitSystem.METRIC,
            region: "PK", // Pakistan region for better local routing
          },
          (result, status) => {
            if (
              status === window.google.maps.DirectionsStatus.OK ||
              status === "OK"
            ) {
              try {
                // Get the route path and add connector lines to markers
                const route = result.routes[0];
                if (
                  route &&
                  route.overview_path &&
                  route.overview_path.length > 0
                ) {
                  // Get the route start and end points
                  const routeStart = route.overview_path[0];
                  const routeEnd =
                    route.overview_path[route.overview_path.length - 1];

                  // Create the main road-following route using DirectionsRenderer
                  directionsRendererRef.current.setOptions({
                    suppressMarkers: true,
                    suppressInfoWindows: true,
                    draggable: false,
                    preserveViewport: true,
                    polylineOptions: {
                      strokeColor: "#1976D2",
                      strokeWeight: 6,
                      strokeOpacity: 0.9,
                      geodesic: false,
                    },
                  });

                  directionsRendererRef.current.setMap(map);
                  directionsRendererRef.current.setDirections(result);

                  // Create connector lines to attach route to markers
                  const connectorLines = [];

                  // Line from job marker to route start
                  const startConnector = new window.google.maps.Polyline({
                    path: [
                      origin,
                      { lat: routeStart.lat(), lng: routeStart.lng() },
                    ],
                    strokeColor: "#1976D2",
                    strokeWeight: 6,
                    strokeOpacity: 0.9,
                    geodesic: true,
                    map: map,
                  });
                  connectorLines.push(startConnector);

                  // Line from route end to worker marker
                  const endConnector = new window.google.maps.Polyline({
                    path: [
                      { lat: routeEnd.lat(), lng: routeEnd.lng() },
                      destination,
                    ],
                    strokeColor: "#1976D2",
                    strokeWeight: 6,
                    strokeOpacity: 0.9,
                    geodesic: true,
                    map: map,
                  });
                  connectorLines.push(endConnector);

                  // Add direction arrow on the route
                  const midPoint = Math.floor(route.overview_path.length / 2);
                  const arrowMarker = new window.google.maps.Marker({
                    position: {
                      lat: route.overview_path[midPoint].lat(),
                      lng: route.overview_path[midPoint].lng(),
                    },
                    map: map,
                    icon: {
                      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                      scale: 4,
                      strokeColor: "#FFFFFF",
                      strokeWeight: 1,
                      fillColor: "#1976D2",
                      fillOpacity: 1,
                    },
                    zIndex: 1000,
                  });
                  connectorLines.push(arrowMarker);

                  // Store all elements for cleanup
                  connectionLineRef.current = {
                    renderer: directionsRendererRef.current,
                    connectors: connectorLines,
                    setMap: function (mapInstance) {
                      this.renderer.setMap(mapInstance);
                      this.connectors.forEach((line) => {
                        if (line.setMap) line.setMap(mapInstance);
                      });
                    },
                  };

                  console.log(
                    "✅ Connected road route rendered with attachment lines"
                  );
                  return;
                }
              } catch (e) {
                console.warn("❌ Error rendering connected route:", e);
              }
            } else {
              console.warn("❌ Directions request failed:", status, result);
            }

            // Fallback: draw a dashed line if directions service failed
            const fallbackLine = new window.google.maps.Polyline({
              path: [origin, destination],
              geodesic: true,
              strokeColor: "#FF6B35",
              strokeOpacity: 0.8,
              strokeWeight: 4,
              icons: [
                {
                  icon: {
                    path: "M 0,-1 0,1",
                    strokeOpacity: 1,
                    scale: 2,
                  },
                  offset: "0",
                  repeat: "10px",
                },
              ],
              map: map,
            });
            connectionLineRef.current = fallbackLine;
          }
        );
      } else {
        // If DirectionsService isn't available, fallback to dashed line
        const fallbackLine = new window.google.maps.Polyline({
          path: [origin, destination],
          geodesic: true,
          strokeColor: "#FF6B35",
          strokeOpacity: 0.8,
          strokeWeight: 4,
          icons: [
            {
              icon: {
                path: "M 0,-1 0,1",
                strokeOpacity: 1,
                scale: 2,
              },
              offset: "0",
              repeat: "10px",
            },
          ],
          map: map,
        });
        connectionLineRef.current = fallbackLine;
      }
    },
    [map]
  );

  // Function to remove connection line
  const removeConnectionLine = useCallback(() => {
    if (connectionLineRef.current) {
      connectionLineRef.current.setMap(null);
      connectionLineRef.current = null;
    }
  }, []);

  // Initialize map
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        if (!window.google || !window.google.maps) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places,geometry&v=weekly`;
          script.async = true;
          script.defer = true;

          await new Promise((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = (error) => reject(error);
            document.head.appendChild(script);
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        if (
          isMounted &&
          mapRef.current &&
          window.google &&
          window.google.maps
        ) {
          const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: CONFIG.PAKISTAN_CENTER,
            zoom: CONFIG.DEFAULT_ZOOM,
            mapTypeId: "roadmap",
          });

          if (isMounted) {
            setMap(mapInstance);
          }
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Create job markers
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // Clear any existing connection line
    removeConnectionLine();

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap && m.setMap(null));
    markersRef.current = [];

    const jobsWithCoordinates = jobs.filter((job) => {
      return (
        job.Latitude &&
        job.Longitude &&
        typeof job.Latitude === "number" &&
        typeof job.Longitude === "number" &&
        job.status !== "completed" &&
        job.status !== "cancelled"
      );
    });

    const newMarkers = jobsWithCoordinates.map((job) => {
      const position = { lat: job.Latitude, lng: job.Longitude };

      const isAssigned =
        job.status === "assigned" || Boolean(job.assignedWorkerId);
      const serviceKey = getServiceKey(job);
      const markerIcon = createServiceIcon(serviceKey, isAssigned);

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: job.title_en || "Job",
        icon: markerIcon,
        jobId: job.id,
      });

      const infoWindowContent = `
        <div style="padding: 10px; min-width: 200px;">
          <div style="margin-bottom: 10px;">
            <h3 style="margin: 0; color: #333; font-size: 16px;">${
              job.title_en || "Job"
            }</h3>
            <p style="margin: 0; color: #666; font-size: 12px;">${
              job.serviceType || "Service"
            }</p>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>📍 Location:</strong> ${
              job.Location || job.Address || "N/A"
            }<br>
            <strong>💰 Price:</strong> ${job.currency} ${job.price || "N/A"}<br>
            <strong>📱 Phone:</strong> ${job.posterPhone || "N/A"}
          </div>
          <div style="margin: 8px 0;">
            <span style="display:inline-block;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:600;background:${
              isAssigned ? "#fee2e2" : "#dcfce7"
            };color:${isAssigned ? "#b91c1c" : "#166534"};">${
        isAssigned ? "ONGOING" : "AVAILABLE"
      }</span>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>📝 Description:</strong><br>
            <span style="color: #666; font-size: 12px;">${
              job.description_en || "No description"
            }</span>
          </div>
          <div style="text-align: center; margin-top: 10px;">
            <button onclick="window.openJobDetails('${
              job.id
            }')" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">View Details</button>
          </div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener("click", () => {
        markersRef.current.forEach((m) => {
          if (m.infoWindow) m.infoWindow.close();
        });
        infoWindow.open(map, marker);
        onJobClick && onJobClick(job);
      });

      marker.addListener("mouseover", () => {
        if (job.assignedWorkerId) {
          const worker = workers.find((w) => w.id === job.assignedWorkerId);
          if (worker) {
            const workerMarker = workerMarkersRef.current.find(
              (m) => m.workerId === worker.id
            );
            if (workerMarker) {
              drawConnectionLine(
                marker.getPosition(),
                workerMarker.getPosition()
              );
            }
          }
        }
      });

      marker.addListener("mouseout", () => {
        removeConnectionLine();
      });

      marker.infoWindow = infoWindow;
      return marker;
    });

    markersRef.current = newMarkers;

    // Auto-centering
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach((m) => {
        try {
          const p = m.getPosition();
          if (p) bounds.extend(p);
        } catch (e) {}
      });
      if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
        const listener = window.google.maps.event.addListener(
          map,
          "idle",
          () => {
            if (map.getZoom() > 15) map.setZoom(15);
            window.google.maps.event.removeListener(listener);
          }
        );
      }
    }

    return () => {
      newMarkers.forEach((m) => m.setMap && m.setMap(null));
    };
  }, [
    map,
    jobs,
    onJobClick,
    workers,
    drawConnectionLine,
    removeConnectionLine,
  ]);
  // Create worker markers
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // Clear existing worker markers
    workerMarkersRef.current.forEach((m) => m.setMap && m.setMap(null));
    workerMarkersRef.current = [];

    // Filter active workers with valid coordinates
    const activeWorkersWithCoordinates = workers.filter((worker) => {
      const lat =
        worker.currentLocation?.latitude ||
        worker.currentLatitude ||
        worker.latitude;
      const lng =
        worker.currentLocation?.longitude ||
        worker.currentLongitude ||
        worker.longitude;
      return (
        lat &&
        lng &&
        typeof lat === "number" &&
        typeof lng === "number" &&
        worker.isActive !== false
      );
    });

    console.log(
      "👷 Creating markers for active workers:",
      activeWorkersWithCoordinates.length
    );

    const newWorkerMarkers = activeWorkersWithCoordinates.map((worker) => {
      const lat =
        worker.currentLocation?.latitude ||
        worker.currentLatitude ||
        worker.latitude;
      const lng =
        worker.currentLocation?.longitude ||
        worker.currentLongitude ||
        worker.longitude;

      const position = {
        lat: lat,
        lng: lng,
      };

      // Get worker profile picture or generate one
      const profilePic =
        worker.ProfilePicture ||
        worker.profileImage ||
        worker.avatar ||
        worker.photo;
      const workerName =
        worker.Name || worker.displayName || worker.name || "Worker";

      // Create custom marker icon with worker's profile picture
      let markerIcon;
      if (profilePic) {
        // Use custom icon with profile picture
        markerIcon = {
          url: profilePic,
          scaledSize: new window.google.maps.Size(50, 50),
          anchor: new window.google.maps.Point(25, 25),
          shape: {
            type: "circle",
            coords: [25, 25, 25],
          },
        };
      } else {
        // Use blue marker for workers (different from job markers)
        markerIcon = {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        };
      }

      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: workerName,
        icon: markerIcon,
        workerId: worker.id,
      });

      // Add hover events for workers
      marker.addListener("mouseover", () => {
        // Find any jobs assigned to this worker
        const assignedJobs = jobs.filter(
          (job) => job.assignedWorkerId === worker.id
        );
        assignedJobs.forEach((job) => {
          const jobMarker = markersRef.current.find((m) => m.jobId === job.id);
          if (jobMarker) {
            drawConnectionLine(marker.getPosition(), jobMarker.getPosition());
          }
        });
      });

      marker.addListener("mouseout", () => {
        removeConnectionLine();
      });

      // Create info window content with worker picture and name
      const infoWindowContent = `
        <div style="padding: 10px; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            ${
              profilePic
                ? `
              <img 
                src="${profilePic}" 
                alt="${workerName}"
                style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #2196F3;"
              />
            `
                : ""
            }
            <div>
              <h3 style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${workerName}</h3>
              <p style="margin: 2px 0 0 0; color: #666; font-size: 12px;">${
                worker.categories?.[0] || worker.skills?.[0] || "Skilled Worker"
              }</p>
            </div>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>📍 Location:</strong> ${
              worker.City || worker.city || worker.currentAddress || "N/A"
            }<br>
            <strong>📱 Phone:</strong> ${
              worker.phoneNumber || worker.phone || "N/A"
            }<br>
            ${
              worker.categories
                ? `<strong>🛠️ Skills:</strong> ${worker.categories
                    .slice(0, 3)
                    .join(", ")}${
                    worker.categories.length > 3 ? "..." : ""
                  }<br>`
                : ""
            }
          </div>
          <div style="margin: 8px 0;">
            <span style="display:inline-block;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:600;background:#e3f2fd;color:#1976d2;">
              ${worker.jobAssigned ? "ON JOB" : "AVAILABLE"}
            </span>
          </div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
      });

      // Add click listener
      marker.addListener("click", () => {
        // Close any existing info windows
        markersRef.current.forEach((m) => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        workerMarkersRef.current.forEach((m) => {
          if (m.infoWindow && m !== marker) {
            m.infoWindow.close();
          }
        });

        // Open info window
        infoWindow.open(map, marker);

        // Trigger worker click if handler exists
        if (onWorkerClick) {
          onWorkerClick(worker);
        }
      });

      marker.infoWindow = infoWindow;
      return marker;
    });

    workerMarkersRef.current = newWorkerMarkers;

    // Auto-center map on all markers (jobs + workers) if we have any
    const allMarkers = [...(markersRef.current || []), ...newWorkerMarkers];
    if (allMarkers.length > 0) {
      // Use a timeout to ensure markers are fully rendered
      setTimeout(() => {
        const bounds = new window.google.maps.LatLngBounds();
        allMarkers.forEach((marker) => {
          try {
            const pos = marker.getPosition();
            if (pos) bounds.extend(pos);
          } catch (e) {
            console.warn("Error getting marker position:", e);
          }
        });

        if (bounds.isEmpty()) return;

        if (allMarkers.length === 1) {
          map.setCenter(allMarkers[0].getPosition());
          map.setZoom(15);
        } else {
          map.fitBounds(bounds);
          const listener = window.google.maps.event.addListener(
            map,
            "idle",
            () => {
              if (map.getZoom() > 15) map.setZoom(15);
              window.google.maps.event.removeListener(listener);
            }
          );
        }
      }, 100);
    }

    return () => {
      newWorkerMarkers.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
    };
    // Note: markersRef is a ref and doesn't need to be in dependencies
    // We access it directly in the effect to get current job markers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, workers, onWorkerClick]);

  // Periodically update worker marker positions in-place so moving workers show near real-time locations
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const intervalMs = 2000; // update every 2 seconds
    const intervalId = setInterval(() => {
      try {
        (workers || []).forEach((worker) => {
          const lat =
            worker.currentLocation?.latitude ||
            worker.currentLatitude ||
            worker.latitude;
          const lng =
            worker.currentLocation?.longitude ||
            worker.currentLongitude ||
            worker.longitude;

          if (typeof lat === "number" && typeof lng === "number") {
            const marker = workerMarkersRef.current.find(
              (m) => m.workerId === worker.id
            );
            if (marker && marker.setPosition) {
              // Only update position; do not recreate marker to keep open info windows, listeners, etc.
              marker.setPosition({ lat, lng });
            }
          }
        });
      } catch (err) {
        console.warn("Error updating worker marker positions:", err);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [map, workers]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
    </div>
  );
};

// Main MapView Component
const MapView = () => {
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs();
  const {
    workers,
    loading: workersLoading,
    error: workersError,
  } = useWorkers();
  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedJobForAssignment, setSelectedJobForAssignment] =
    useState(null);

  // Global function for info window button
  useEffect(() => {
    window.openJobDetails = (jobId) => {
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        setSelectedJob(job);
        setIsJobModalOpen(true);
      }
    };

    // Global function for job completion
    window.completeJob = (jobId) => {
      handleJobCompletion(jobId);
    };
  }, [jobs]);

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setIsJobModalOpen(true);
  };

  const handleAssignJob = (job) => {
    setSelectedJobForAssignment(job);
    setIsAssignmentModalOpen(true);
  };

  async function getFcmToken(userId) {
    try {
      const db = getFirestore(app);
      const docRef = doc(db, "Tokens", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.fcmToken || null;
      } else {
        console.log("No such user!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  }

  const handleJobAssignment = async (
    jobId,
    workerId,
    worker,
    notes,
    jobPosterId
  ) => {
    try {
      const db = getFirestore(app);
      const fcmToken = await getFcmToken(workerId);
      console.log("FCM Token:", fcmToken);
      // Find the job details
      const job = jobs.find((j) => j.id === jobId);
      if (!job) {
        alert("Job not found!");
        return;
      }

      // Check if job is already assigned
      if (job.status === "assigned" || job.assignedWorkerId) {
        alert("This job has already been assigned to another worker!");
        return;
      }

      // Check if worker already has a job assigned
      if (worker.jobAssigned || worker.assignedJobId) {
        alert(
          "This worker already has a job assigned! Please select another worker."
        );
        return;
      }

      // Create assigned job document
      const assignedJobData = {
        // Job Details
        jobId: jobId,
        jobTitle: job.title_en || "Job Title",
        jobTitleUrdu: job.title_ur || job.title_en || "Job Title",
        jobDescription: job.description_en || "No description",
        jobDescriptionUrdu:
          job.description_ur || job.description_en || "No description",
        jobServiceType: job.serviceType || "General",
        jobLocation: job.Location || job.Address || "N/A",
        jobLocationAddress: job.Address || job.Location || "N/A",
        jobLocationCoordinates: {
          latitude: job.Latitude || null,
          longitude: job.Longitude || null,
        },
        jobPrice: job.price || 0,
        jobCurrency: job.currency || "PKR",
        jobImage: job.Image || null,
        jobCreatedAt: job.createdAt,
        jobStatus: job.status || "pending",
        jobAdminAction: job.adminAction || "pending",

        // Job Poster Details
        jobPosterId: job.jobPosterId || "unknown",
        jobPosterPhone: job.posterPhone || "N/A",
        jobPosterName: "Job Poster", // You might want to fetch this from JobPosters collection

        // Skilled Worker Details
        workerId: workerId,
        workerName:
          worker.Name || worker.displayName || worker.name || "Unknown Worker",
        workerPhone: worker.phoneNumber || worker.phone || "N/A",
        workerEmail: worker.email || "N/A",
        workerCity: worker.City || worker.city || "N/A",
        workerAddress:
          worker.currentAddress || worker.City || worker.city || "N/A",
        workerLocationCoordinates: {
          latitude:
            worker.currentLocation?.latitude ||
            worker.currentLatitude ||
            worker.latitude ||
            null,
          longitude:
            worker.currentLocation?.longitude ||
            worker.currentLongitude ||
            worker.longitude ||
            null,
        },
        workerAge: worker.Age || worker.age || "N/A",
        workerCNIC: worker.cnic || "N/A",
        workerSkills: worker.categories || worker.skills || [],
        workerProfileImage:
          worker.ProfilePicture || worker.profileImage || null,
        workerRating: worker.averageRating || worker.rating || 0,
        workerExperience: worker.experience || "0",
        workerApprovalStatus: worker.approvalStatus || "pending",
        workerIsVerified: worker.isVerified || false,
        workerIsActive: worker.isActive !== false,

        // Assignment Details
        assignmentNotes: notes || "",
        assignedAt: new Date(),
        assignedBy: "admin", // Since this is admin panel
        assignedByName: "Admin User",
        assignmentStatus: "assigned", // assigned, in_progress, completed, cancelled
        assignmentId: `assignment_${jobId}_${workerId}_${Date.now()}`,

        // Location Distance (if both coordinates available)
        distanceBetweenLocations: (() => {
          const jobLat = job.Latitude;
          const jobLng = job.Longitude;
          const workerLat =
            worker.currentLocation?.latitude ||
            worker.currentLatitude ||
            worker.latitude;
          const workerLng =
            worker.currentLocation?.longitude ||
            worker.currentLongitude ||
            worker.longitude;

          if (jobLat && jobLng && workerLat && workerLng) {
            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in kilometers
            const dLat = ((workerLat - jobLat) * Math.PI) / 180;
            const dLng = ((workerLng - jobLng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((jobLat * Math.PI) / 180) *
                Math.cos((workerLat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return Math.round(distance * 100) / 100; // Round to 2 decimal places
          }
          return null;
        })(),

        // System Fields
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      // Save to AssignedJobs collection
      const docRef = await addDoc(
        collection(db, "AssignedJobs"),
        assignedJobData
      );

      // Update the original job to mark as assigned
      const jobRef = doc(db, "Job", jobId);
      await updateDoc(jobRef, {
        status: "assigned",
        assignedWorkerId: workerId,
        assignedWorkerName: worker.Name || worker.displayName || worker.name,
        assignedAt: new Date(),
        assignedJobId: docRef.id,
      });

      // Update worker to mark as assigned
      const workerRef = doc(db, "SkilledWorkers", workerId);
      await updateDoc(workerRef, {
        jobAssigned: true,
        assignedJobId: docRef.id,
        jobAssignedAt: new Date(),
        currentJobId: jobId,
      });

      // Create a notification document for the assigned worker
      try {
        const notifRef = await addDoc(collection(db, "Notifications"), {
          userId: workerId,
          userType: "skilled_worker",
          title: "Job Assigned",
          body: "Open the app to view details.",
          type: "job_assigned",
          assignedJobId: docRef.id,
          data: {
            jobId,
            assignmentId: docRef.id,
            jobTitle: assignedJobData.jobTitle,
            jobLocation: assignedJobData.jobLocation,
            workerName: assignedJobData.workerName,
          },
          read: false,
          createdAt: serverTimestamp(),
        });

        // Store notificationId on the assignment for traceability
        await updateDoc(doc(db, "AssignedJobs", docRef.id), {
          notificationId: notifRef.id,
        });
      } catch (notifDocErr) {
        console.warn("Failed to create Notifications document:", notifDocErr);
      }

      // Send push notification with assigned job details to the worker app
      try {
        let fcmToken =
          worker.fcmToken || worker.pushToken || worker.notificationToken;
        if (!fcmToken) {
          try {
            const workerSnap = await getDoc(doc(db, "Tokens", workerId));
            if (workerSnap.exists()) {
              fcmToken = workerSnap.data()?.fcmToken;
            }
          } catch (readTokenErr) {
            console.warn(
              "Could not read fcmToken from Firestore:",
              readTokenErr
            );
          }
        }

        const res = async (userId, jobPosterId) => {
          const res = await fetch(
            "https://us-central1-skillzaar-bcb0f.cloudfunctions.net/createNotificationAndSend",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: userId,
                jobPosterId: jobPosterId,
                title: "Job Assigned",
                body: "Open the app to view details.",
              }),
            }
          );

          const data = await res.json();

          console.log("Notification response:", data);
        };
        console.log("jobPosterId", jobPosterId);
        console.log("workerId", workerId);
        res(workerId, jobPosterId);
        console.log("Notification response:", res);
        // if (res.ok) {
        //   const json = await res.json().catch(() => ({}));
        //   const notificationId = json?.id;
        //   // Save trace of notification on AssignedJobs
        //   await updateDoc(doc(db, 'AssignedJobs', docRef.id), {
        //     notificationId: notificationId || null,
        //     notifySent: true,
        //     notifiedAt: new Date()
        //   });
        // } else {
        //   const errorText = await res.text().catch(() => '');
        //   console.warn('Notification API responded with non-OK status', res.status, errorText);
        //   await updateDoc(doc(db, 'AssignedJobs', docRef.id), {
        //     notifySent: false
        //   });
        // }
      } catch (notifErr) {
        console.error("Failed to send assignment notification:", notifErr);
        try {
          await updateDoc(doc(db, "AssignedJobs", docRef.id), {
            notifySent: false,
          });
        } catch {}
      }

      console.log("Job assigned successfully! Assignment ID:", docRef.id);
      alert(
        `Job assigned to ${
          worker.Name || worker.displayName || worker.name
        }! Assignment saved to AssignedJobs collection.`
      );
    } catch (error) {
      console.error("Error assigning job:", error);
      alert("Error assigning job. Please try again.");
    }
  };

  const handleCloseJobModal = () => {
    setIsJobModalOpen(false);
    setSelectedJob(null);
  };

  const handleCloseAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setSelectedJobForAssignment(null);
  };

  // Function to handle job completion
  const handleJobCompletion = async (jobId) => {
    try {
      const db = getFirestore(app);
      const jobRef = doc(db, "Job", jobId);

      // Update job status to completed
      await updateDoc(jobRef, {
        status: "completed",
        completedAt: new Date(),
      });

      // Find and update the assigned job record
      const assignedJobsQuery = query(
        collection(db, "AssignedJobs"),
        where("jobId", "==", jobId)
      );
      const assignedJobsSnapshot = await getDocs(assignedJobsQuery);

      if (!assignedJobsSnapshot.empty) {
        const assignedJobDoc = assignedJobsSnapshot.docs[0];
        await updateDoc(doc(db, "AssignedJobs", assignedJobDoc.id), {
          assignmentStatus: "completed",
          completedAt: new Date(),
        });

        // Update worker status
        const assignedJobData = assignedJobDoc.data();
        if (assignedJobData.workerId) {
          const workerRef = doc(db, "SkilledWorkers", assignedJobData.workerId);
          await updateDoc(workerRef, {
            jobAssigned: false,
            assignedJobId: null,
            currentJobId: null,
            jobCompletedAt: new Date(),
            status: "available",
          });
        }
      }

      console.log("Job marked as completed and removed from map");
      alert("Job completed successfully! It has been removed from the map.");
    } catch (error) {
      console.error("Error completing job:", error);
      alert("Error completing job. Please try again.");
    }
  };

  // Function to handle job cancellation (free worker)
  const handleJobCancel = async (jobId) => {
    try {
      const db = getFirestore(app);
      const jobRef = doc(db, "Job", jobId);

      // Update job status to cancelled and clear assignment
      await updateDoc(jobRef, {
        status: "cancelled",
        cancelledAt: new Date(),
        assignedWorkerId: null,
        assignedWorkerName: null,
      });

      // Find and update the assigned job record
      const assignedJobsQuery = query(
        collection(db, "AssignedJobs"),
        where("jobId", "==", jobId)
      );
      const assignedJobsSnapshot = await getDocs(assignedJobsQuery);
      if (!assignedJobsSnapshot.empty) {
        const assignedJobDoc = assignedJobsSnapshot.docs[0];
        await updateDoc(doc(db, "AssignedJobs", assignedJobDoc.id), {
          assignmentStatus: "cancelled",
          cancelledAt: new Date(),
        });

        // Update worker to free them up
        const assignedJobData = assignedJobDoc.data();
        if (assignedJobData.workerId) {
          const workerRef = doc(db, "SkilledWorkers", assignedJobData.workerId);
          await updateDoc(workerRef, {
            jobAssigned: false,
            assignedJobId: null,
            currentJobId: null,
            status: "available",
          });
        }
      }

      alert("Job cancelled and worker set to available.");
    } catch (error) {
      console.error("Error cancelling job:", error);
      alert("Error cancelling job. Please try again.");
    }
  };

  const loading = jobsLoading || workersLoading;
  const error = jobsError || workersError;

  if (loading) {
    return (
      <div className="map-view-container">
        <div className="map-header">
          <h2>Jobs Map View</h2>
          <p>Loading map...</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading map, jobs, and workers data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-view-container">
        <div className="map-header">
          <h2>Jobs Map View</h2>
          <p>Error loading map</p>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h3>❌ Error Loading Map</h3>
            <p>{error}</p>
            <p>Please check your internet connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view-container">
      <div className="map-header">
        <h2>Jobs & Workers Map View</h2>
        <p>
          Real-time map of available jobs ({jobs.length} jobs) and active
          workers ({workers.filter((w) => w.isActive !== false).length} workers)
        </p>
      </div>

      <div className="map-content">
        <MapComponent
          jobs={jobs}
          workers={workers}
          onJobClick={handleJobClick}
          onWorkerClick={(worker) => {
            // Optional: Handle worker click - could show worker details modal
            console.log("Worker clicked:", worker);
          }}
        />
      </div>

      <JobDetailsModal
        job={selectedJob}
        isOpen={isJobModalOpen}
        onClose={handleCloseJobModal}
        onAssign={handleAssignJob}
        onCancel={handleJobCancel}
        onComplete={handleJobCompletion}
      />

      <JobAssignmentModal
        job={selectedJobForAssignment}
        workers={workers}
        isOpen={isAssignmentModalOpen}
        onClose={handleCloseAssignmentModal}
        onAssign={handleJobAssignment}
      />
    </div>
  );
};

export default MapView;
