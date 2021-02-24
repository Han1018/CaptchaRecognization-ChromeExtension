# CaptchaRecognization-ChromeExtension
用Chrome Extension 搭配分割式驗證碼辨識，簡單使用。
##    概要
這篇主要是為了幫助快速登入學校的入口網站所設計的套件。目標是利用Chrome Extension，爬蟲抓取學校入口的驗證碼，再經由CNN辨識/驗證碼分割後CNN兩種方式，辨識驗證碼，進行自動登入。
##    訓練方式/爬取訓練/預測資料
因為CNN訓練需要的大量的資料，拿到資料會是訓練前的一個大重點。目前獲取驗證碼主要有主要幾種方式，最後考量技術難度和效果的平衡下，選擇的是切割驗證碼辨識，雖然是35%的辨識率，但因為爬蟲速度蠻快的，所以基本上1、2秒內就能成功辨識完。
- 硬幹手動標註資料 : 

        優: 預測完美，基本上99.8%的成功預測率
        缺: 需要大量標註資料(根據自製驗證碼測試，大約2、3萬張左右)，小專案沒時間加上太懶就放棄這條路了。
- 驗證碼切割驗證 :

        優: 少量資料(100張左右)即可，重心主要放在切割文字上
        缺: 辨識率遠不及直接Training整張圖(約35%左右的成功率)，主要還是看
        驗證碼的切割分離程度，如果重疊情況小，辨識率就較高，反之。
        
- 模仿驗證碼 : 
        
        這個方法再後面也有實作，細節可以看後面。
        
        優: 產生自製驗整碼後便可以解決Training整張圖時需要大量資料的問題，
        直接用驗證碼的圖丟進CNN模型裡，基本上99%辨識成功率
        
        缺: 這個缺點也很直接，CNN很吃細節，如果細節/結構不一樣時，辨識率基本
        上也就不堪一擊，這是個雙面刃。我們有盡力的模仿出一些樣子，但實際上在
        字型、干擾線的位置、顏色的設計跟實際上還是有落差。因此辨識率接近0。
- AutoEncoder
    
        這個方法也是這幾年突然新起的，用模型紀錄並還原壓縮&解壓縮的過程，找出
        驗證碼的變化，這樣我們就可以從變化抓出新的驗證碼，要辨識驗證碼時就進行
        壓縮&解壓縮的動作抓去圖片在維度的區間，由此辨識。
        
        這個方法可行性比較不確定，但需要考慮的是驗證碼由4個英文數字組成，所以也
        就有26^4種排列組合，如何在維度裡很好的切割各個區域的結果，那就是個要克
        服的問題了。
##    模仿驗證碼
![](https://i.imgur.com/OtAC7mW.png)

可以看到雖然是不太像拉，但應該也有畫出一個大概的輪廓八哈哈哈，反正最後也不是用這個方法實作出最後的。但還是有根據一些方法弄出的，主要概念是建立一個畫布，然後加入文字、背景、干擾線、點等，詳細可以看程式裡的。

- 背景: 
```
#(20,80)是透明化的程度，RGB是隨機從0-255產生
image = Image.new('RGBA', (width,height),cls.__gene_random_color(20, 80))
```
- 干擾線:
```
#用來繪制幹擾線
@classmethod
def __gene_line(cls, draw, width, height):
    begin = (random.randint(width*-1, width), random.randint(height*-1, height))
    end = (random.randint(int(width/2), width), random.randint(0, height))
    draw.line([begin, end], fill=cls.__gene_random_color(0,200), width=3)
    
#隨機產生4-6條寬度為3的干擾線
for x in range(0, random.randint(4,6)):
    cls.__gene_line(draw, width, height)
```
- 產生字體: 
```
# 生成隨機的文字顏色
@classmethod
def __gene_random_font_color(cls, start=0, end=255):
    random.seed()
    return (random.randint(0, 50),random.randint(0, 50), random.randint(0, 50), random.randint(start, end))

# 隨機選擇一個字體
@classmethod
def __gene_random_font(cls):
    fonts = ['Times-New-Roman.ttf']
    font = random.choice(fonts)
    return '/content/drive/MyDrive/ProJ_Proofnum/font/' + font

```
- 加入噪點:

```
# 用來繪制幹擾點
@classmethod
def __gene_points(cls, draw, point_chance, width, height):
    chance = min(100, max(0, int(point_chance))) #大小限制在[0, 100]
    for w in range(width):
        for h in range(height):
            tmp = random.randint(0, 100)
            if tmp > 100 - chance:
                draw.point((w, h), fill=cls.__gene_random_color())
```

##    預處理資料(1) - 清除驗證碼雜訊
為了讓切割更順利，需要先消除干擾點、線，網路上搜尋到的是利用回歸方法去除多餘的線，[點這](https://www.youtube.com/watch?v=4DHcOPSfC4c)。
我們主要是覺得有點繁瑣，所以我們用了些圖像演算法，也達成也不錯的效果，因此也可以參考一下我們的。
![](https://i.imgur.com/1AHnURP.png)

可以看到經過三個主要的步驟，大部分的噪點和干擾線都被消除掉了，圖像也沒有受到太多的影響，維持了主要的形狀，這樣之後就比較方便我們進行切割。
1. **模糊化 - 消除造點  :**
```
    "None-Local Means" : 
        同樣是模糊化沒用高斯/平均/非等向性擴散...主要是因為他們都是局部模糊，
    只根據點周圍的值進行運算。而None-Local Means顧名思義是非局部平均，它將是以區塊區塊的方式
    進行比較，是個整體得概念，每一點都是與圖片上所有點進行比較過後的結果，因此不易影響到主體。

        缺點就是它的複雜度較高，不過我們由於量不大且像素小，因此對於這個運算度是可以接受的。

     參考: https://zh.wikipedia.org/wiki/%E9%9D%9E%E5%B1%80%E9%83%A8%E5%B9%B3%E5%9D%87 
```
3. **二值化 - 去除背景 :**
```
    "Otsu-threshold" :
        利用Otsu演算法可以自動找到能夠產生最大變異數得閥值，也就是不用設定常數自己就能
    根據每張圖的色彩分布情況，產生合適的threshold，最後得到的結果是黑白色彩。
```
5. **重新整理 - 平衡整體、去除砸邊&造點:**    
```
    "Medium Filter & Morphology-Closing" :
        在經過二值化後的圖形還是會有一些有雜點和邊緣不太整齊的東西，這是因為已經是二值畫的圖片所以就
    可以直接用Medium Filter找出區域內經過排序的中間值，以此把一些剩餘的雜點去除或是縮小。而毛邊就可
    以用Morphology-Closing，將文字邊緣放大後再圓滑的縮小，讓邊緣可以看起來更平整一些。
```
##    預處理資料(2)-切割文字

![](https://i.imgur.com/OPuV5Ce.png)

在經過模糊二值化後的圖片，已經清晰非常多了，餘留下的內容也是在可接受的範圍內，這時就要進行切割的動作。由於驗證碼文字的位置會隨機生成，所以可能會有重疊的時候，這時我實作的方法是先用寬度判斷文字可能的數量。例如大部分一個數字都介於3-25，二個數字介於25-35，三個數字35-45，剩下就是四個數字黏在一起。
```
#切割圖片驗證碼
def resplit(image):
    #沒找到圖片就返回
    split_image=[]
    part=1
    if image is None:
        print('是空的')
        return
    height, width = image.shape
    #4個黏在一起
    if width >= 85:    
        part=4
    #3個黏在一起    
    elif width >= 55:
        part=3
    #2個黏在一起        
    elif width >= 35:
        part=2     
    else:
        split_image.append(image)
        return split_image,part

    split_image=resplit_with_parts(image, part)        
    return split_image,part
```
詳細的可以參考程式碼split_picture.py & resplit.py部分，切割後圖片為了能跑進CNN模型會需要將圖片Resize成統一大小，才能訓練/預測。
##    建立模型(Keras)
我們建立的模型就是簡單標準的CNN，當然因為切割後的文字辨識，其實就相等於EMINST辨識十分簡單。所以資料來源也不一定需要是原始真實資料，這一次實作就是用不可考來源當作訓練資料集的。
![](https://i.imgur.com/8g0k5lh.png)
*source:https://github.com/JasonLiTW/simple-railway-captcha-solver*
我們的設計結構模型是仿照上面這一篇Githup大大實作的，細節也可以參考他的網站。
##    部署模型(Flask)
為了將訓練好的模型套用至Chrome插件裡，需要將訓練好的Model包裝成一個API形式給插件使用，所以用到了Flask來製作這個簡單的API
```
@app.route('/predict_image', methods=['POST'])
def predict_image():
  print('hi')
  image_list=[]
  if request.method == 'POST':
    if request.files.get('image'):
      # 從 flask request 中讀取圖片（byte str）
      image = request.files['image'].read()
      # 將圖片轉成 PIL 可以使用的格式
      image = Image.open(io.BytesIO(image))
      #將圖片轉成np形式
      image_list.append(np.array(image).reshape(39,135,3))
      #預測
      predict_res=main_exc(image_list)
      response={"predict":predict_res}
      #回傳預測結果
      return jsonify(response)
```
