import "./App.css";
import Peer from "simple-peer";
import SokcetIOClient from "socket.io-client";
import { toast } from "react-toastify";
import { Button, Icon, Input } from "semantic-ui-react";
import "react-toastify/dist/ReactToastify.css";
import { AppBar, Input as Inp, Grid } from "@material-ui/core";
// const Peer = require("simple-peer");

import React, { Component } from "react";

toast.configure();
let socket;

export class App extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.remoteRef = React.createRef();
    this.toastName = this.toastName.bind(this);
    this.getMedia = this.getMedia.bind(this);
  }
  state = {
    stream: new MediaStream(),
    users: [],
    name: "",
    clientSignal: "",
    otherSignal: "",
    receivingCall: false,
    caller: "",
    callAccepted: false,
    isloadingCam: false,
    clickedAnswer: false,
  };
  toastName = () => toast.success("Please enter name");

  callOtherUser(name) {
    if (!this.state.stream.active) {
      toast.error(
        "Please make sure you have camera turned on. Type name in input box and get camera"
      );
    } else {
      console.log(this.state.stream);
      let peer = new Peer({
        initiator: true,
        trickle: false,
        stream: this.state.stream,
      });

      peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: name,
          signalData: data,
          from: this.state.name,
        });
      });

      peer.on("stream", (stream) => {
        this.remoteRef.current.srcObject = stream;
      });

      socket.on("callAccepted", (signal) => {
        peer.signal(signal);
      });
    }
  }

  getMedia = async () => {
    if (!this.state.name) {
      toast.error("Please enter you name", {
        position: toast.POSITION.TOP_RIGHT,
      });
      console.log("No");
    } else {
      this.setState({ isloadingCam: true });
      console.log("ok");
      try {
        let stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        this.myRef.current.srcObject = stream;
        this.setState({ stream, isloadingCam: false });
        console.log(socket);
        socket.emit("connecti", this.state.name);
      } catch (err) {
        toast.error("You have to allow the audio and video");
        console.log(err);
      }
    }
  };

  acceptCall = () => {
    this.setState({ callAccepted: true, clickedAnswer: true });
    let peer = new Peer({
      initiator: false,
      trickle: false,
      stream: this.state.stream,
    });

    peer.on("signal", (data) => {
      socket.emit("acceptCall", { signal: data, to: this.state.caller });
    });

    peer.on("stream", (stream) => {
      this.remoteRef.current.srcObject = stream;
    });

    peer.signal(this.state.clientSignal);
  };

  takeInput = (e) => {
    this.setState({ name: e.target.value });
  };

  setupBeforeUnloadListener = () => {
    window.addEventListener("beforeunload", (ev) => {
      ev.preventDefault();
      return socket.emit("removal", this.state.name);
    });
  };

  componentDidMount() {
    socket = SokcetIOClient("https://thawing-inlet-11062.herokuapp.com/");
    socket.on("connectedUsers", (users) => {
      console.log(users);
      this.setState({ users: [...users] });
    });

    socket.on("hey", (data) => {
      this.setState({
        receivingCall: true,
        caller: data.from,
        clientSignal: data.signal,
      });
    });
    this.setupBeforeUnloadListener();
  }

  render() {
    return (
      <div>
        <div
          style={{
            width: "100%",
            height: "70px",
            backgroundColor: "#673ab7",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <p
            style={{ fontSize: "27px", fontFamily: "serif", color: "white" }}
            className="animate__animated animate__bounce"
          >
            Two Peer Caller
          </p>
        </div>
        <br />
        <Grid container>
          <Grid xs={false} sm={3} item></Grid>
          <Grid xs={12} sm={6} item style={{ marginBottom: "50px" }}>
            <Grid container direction="">
              <Grid item xs={6} style={{ textAlign: "right" }}>
                <Inp
                  value={this.state.name}
                  onChange={this.takeInput}
                  style={{
                    marginRight: "10px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "5px",
                    background: "#FFF",
                    padding: "2px",
                  }}
                  placeholder="Enter Username"
                  disableUnderline={true}
                />
              </Grid>
              <Grid item xs={6} style={{ textAlign: "left" }}>
                <Button
                  loading={this.state.isloadingCam}
                  onClick={this.getMedia}
                  icon
                  labelPosition="left"
                >
                  <Icon name="camera" />
                  Get Camera
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid xs={false} sm={3} item></Grid>
        </Grid>
        <Grid container direction="row" style={{ padding: "10px" }}>
          <Grid xs={false} sm={2} item></Grid>
          <Grid container xs={12} sm={8} item>
            <Grid container>
              <Grid
                xs={12}
                sm={6}
                item
                style={{
                  backgroundColor: "#eeeeee",
                  height: "440px",
                  border: "1px solid #bdbdbd",
                  borderRadius: "10px",
                }}
              >
                <video
                  autoPlay
                  ref={this.myRef}
                  style={{ width: "100%", height: "100%" }}
                ></video>
              </Grid>
              <Grid
                xs={12}
                sm={6}
                item
                style={{
                  backgroundColor: "#eeeeee",
                  height: "440px",
                  border: "1px solid #bdbdbd",
                  borderRadius: "10px",
                }}
              >
                <video
                  autoPlay
                  ref={this.remoteRef}
                  style={{ width: "100%", height: "100%" }}
                ></video>
              </Grid>
            </Grid>
          </Grid>
          <Grid xs={false} sm={2} item></Grid>
        </Grid>
        <Grid container>
          <Grid xs={0} sm={2} item></Grid>
          <Grid xs={12} sm={8}>
            {this.state.users.map((data, index) => {
              if (data === this.state.name) return null;
              else {
                return (
                  <div style={{ float: "left" }}>
                    <Button
                      onClick={() => this.callOtherUser(data)}
                      key={index}
                      icon
                      labelPosition="right"
                    >
                      <Icon name="phone" />
                      {`Call ${data}`}
                    </Button>
                  </div>
                );
              }
            })}
          </Grid>
          <Grid xs={0} sm={2} item></Grid>
        </Grid>

        <div style={{ margin: "10px", border: "1px solid #ff8a65" }}></div>
        <div style={{ margin: "10px" }}>
          {this.state.receivingCall ? (
            <div className={"animate__animated animate__bounce"}>
              <Button
                onClick={this.acceptCall}
                color={this.state.clickedAnswer ? "green" : "orange"}
                icon
                labelPosition="left"
              >
                <Icon name="phone volume" />
                {this.state.caller} Calling
              </Button>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    );
  }
}

export default App;
