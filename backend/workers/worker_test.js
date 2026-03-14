import { testWorker } from "./worker.js";

console.log("[main] Spawning test worker...");
console.log("[main] Main thread is NOT blocked");

testWorker((err, result) => {
    if (err) {
        console.error("[main] Worker failed:", err.message);
    } else {
        console.log("[main] Worker responded:", result);
    }
});

console.log("[main] This prints before the worker finishes");
