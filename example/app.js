import { featureProbeClient, FPUser} from "featureprobe-client-sdk-miniprogram";
// app.js
App({
  onLaunch() {
    const user = new FPUser();
    user.with("userId", "1234567890");

    //注意将域名添加为可信或关掉域名校验
    featureProbeClient.init({
      remoteUrl: "https://featureprobe.io/server",
      clientSdkKey: "client-25614c7e03e9cb49c0e96357b797b1e47e7f2dff",
      user,
      refreshInterval: 5000,
    });

    featureProbeClient.start();
  },
  globalData: {
    userInfo: null
  }
})
