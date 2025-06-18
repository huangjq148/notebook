import "./App.css";
import { RouterProvider } from "react-router-dom";
import router from "@/routes";
import { Watermark } from "antd";
import { useState } from "react";
import { useUser } from "./store";

function App() {
  const { userInfo } = useUser((state) => ({
    userInfo: state.userInfo,
  }));
  return (
    <Watermark content={`${userInfo.name}(${userInfo.username})`} style={{ height: "100%" }}>
      <RouterProvider router={router} />
    </Watermark>
  );
}

export default App;
