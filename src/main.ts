import { mount } from "svelte";
import "./lib/tokens/cloudscape.css";
import App from "./App.svelte";

const target = document.getElementById("app");
if (!target) throw new Error("parascape: #app mount target not found");

export default mount(App, { target });
