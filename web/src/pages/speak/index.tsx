import { PlayCircleOutlined, StopOutlined } from "@ant-design/icons";
import classnames from "classnames";
import { useState } from "react";
import styles from "./index.module.less";

const words = [
  "可爱的小朋友们，大家下午好！",
  "每一份坚持，都是时光的馈赠；每一次起舞，都是梦想的回响。此刻，让我们把掌声化作翅膀，一起飞向这场属于热爱与成长的盛宴！",
  "他们要带着这句响亮的口号“我命由我不由天”，展现勇敢不服输的决心！\n掌声有请这群热血的大班的跆拳道选手们闪亮登场！",
  "妈妈的爱像阳光，像雨露，滋润着我们成长，接下来，请欣赏儿歌《我爱妈妈》，让我们一起把心底的爱传达给妈妈，掌声欢迎！",
  "每一颗小星星都藏着甜蜜的童话，每一次跳跃都绽放着无忧无虑的光芒。接下来请欣赏小班的小可爱们带来舞蹈《快乐的小星星》",
  "不止老鼠，还有一串串鲜红的辣椒呢",
  "接下来请欣赏由主持小班的小朋友们带来情景剧《小老鼠吃辣椒》",
  "让我们先随柔美的旋律漫步荷塘，再乘欢快的节拍舞向远方——请欣赏葫芦丝基础班的小朋友带来葫芦丝吹奏《荷塘月色》《青春舞曲》。",
  "今天这只聪明的小熊给我们做了最好的榜样，它用实际行动告诉我们”只要勇敢尝试，就能战胜困难！”",
  "我知道了，是我们幼儿园里最酷、最萌的街舞小宝贝！他们用几个月的努力，把可爱和帅气“焊”在了一起！准备好尖叫和掌声，有请幼儿街舞班带来《young god》",
  "接下来，请欣赏儿歌《小兔子和小猪》，看看他们发生了什么趣事，掌声欢迎！",
  "是啊，小小的蚊子，却成了“麻烦”，",
  "接下来，请欣赏儿歌《砍蚊子》，掌声有请！",
  "让我们尽情期待吧！有请两位小班的小朋友为我们带来故事《贪心的老鼠》掌声有请！",
  "魔方，这一凝聚着几何美学与逻辑奥秘的立方体，宛如一座等待探索者征服的思维高峰。它绝非仅仅是玩具，而是开启智慧潜能的神秘锁钥。让我们一起欣赏魔方秀～",
  "现在，让我们用欢快的歌声迎接春天",
  "请欣赏主持小班的孩子们带来儿歌《春天》，掌声有请！",
  "一支巴乌，吹出风月缠绵、民族风情。当大气旋律邂逅灵动音色，且看刚柔并济间，如何演绎对土地的热爱、对岁月的钟情——请欣赏大班提高班带来的葫芦丝吹奏《万疆》《新疆舞曲》",
  "接下来，我们要迎来一群‘小旋风’啦！看！他们穿着整齐的道服，系着神气的腰带，正朝我们走来！掌声有请中班的小跆拳道选手和教练带来《跆舞雄风》的表演！",
  "把茶香、笑靥和对生活的热爱，都藏进摇曳的银饰与轻盈的转身里。请聆听王老师葫芦丝独奏《竹楼里的哨哆哩》",
  "当梦想的种子/在故事里发芽",
  "在朗朗的童声中，感受/中华文化的俏皮和深情，",
  "掌声有请!",
  "今天，我们以梦想为帆，向着星辰大海勇敢启航！",
  "愿孩子们永远保持热爱，在追逐梦想的道路上，绽放属于自己的光芒！",
  "我们下期再见！",
]
const Speak = () => {
  const [currentRowIndex, setCurrentRowIndex] = useState<any>()
  const [isSpeaking, setIsSpeaking] = useState(false)

  function speak(text: string) {
    setIsSpeaking(true)
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN'; // 设置语言（中文）
    window.speechSynthesis.speak(utterance);
    utterance.onend = () => {
      setIsSpeaking(false)
    };
  }

  return (
    <div className={styles.container}>
      {words.map((word, index) =>
        <div key={word}>
          <div className={classnames(styles.word, { [styles.speaking]: currentRowIndex === index })}>
            {isSpeaking && currentRowIndex === index ?
              <StopOutlined
                style={{ color: "#ff8888" }}
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false)
                }} /> :
              <PlayCircleOutlined
                style={{ color: "#8888ff" }}
                onClick={() => {
                  speak(word);
                  setCurrentRowIndex(index)
                }} />
            }{" "}
            {word.split("").map((item, itemIndex) => (
              <span onClick={() => {
                speak(word.slice(itemIndex))
              }}>{item}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Speak