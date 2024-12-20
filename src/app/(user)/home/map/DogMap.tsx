import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import DogInfoBox from "./DogInfoBox";
import { Dog } from "@/types/userInfoType";
import { useUserHome } from "../UserHomeProvider";
import { useNeighborDogs } from "@/hooks/neighborDogQuery";

declare global {
  interface Window {
    kakao: any;
  }
}

const DogMap: React.FC = () => {
  const { data } = useSession();
  const { isBottomOpen, setIsBottomOpen } = useUserHome();
  const user = data?.user; // user가 존재할 때만 값을 사용할 수 있도록 안전하게 처리
  const { data: dogs } = useNeighborDogs(); // 컴포넌트에서 useQuery 호출
  const [currDogInfo, setCurrDogInfo] = useState<(Dog & { id: number }) | null>(
    null
  );

  // 주소를 이용해 위도, 경도 값 반환
  const addressSearch = (address: string) => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (res: any, status: string) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const lat = res[0].y;
          const lng = res[0].x;
          resolve({ lat, lng });
        } else {
          reject("Failed to retrieve coordinates");
        }
      });
    });
  };

  // 마커 생성 함수
  const createMarker = async () => {
    try {
      const userAddr = await addressSearch(user?.address || "");
      const options = {
        center: new window.kakao.maps.LatLng(userAddr.lat, userAddr.lng), // 지도의 중심좌표를 사용자의 위치로 설정
        level: 3, // 지도의 확대 레벨
      };

      const container = document.getElementById("map");
      const map = new window.kakao.maps.Map(container, options);

      // 사용자 마커 설정
      const imageSrc = "/images/marker_img.png",
        imageSize = new window.kakao.maps.Size(64, 69),
        imageOption = { offset: new window.kakao.maps.Point(27, 69) };

      const markerImage = new window.kakao.maps.MarkerImage(
        imageSrc,
        imageSize,
        imageOption
      );
      const userMarkerPosition = new window.kakao.maps.LatLng(
        userAddr.lat,
        userAddr.lng
      );

      // 사용자 마커 생성
      const userMarker = new window.kakao.maps.Marker({
        position: userMarkerPosition,
        image: markerImage,
        clickable: true,
      });

      // 사용자 마커 지도에 추가
      userMarker.setMap(map);

      window.kakao.maps.event.addListener(userMarker, "click", () => {
        map.panTo(userMarkerPosition);
        setIsBottomOpen(false);
      });

      // 이웃 강아지 마커 생성
      dogs.forEach((dog: any) => {
        const dogAddr = dog.address;
        addressSearch(dogAddr)
          .then((dogLocation) => {
            const dogsImages = [
              "marker_img1.png",
              "marker_img2.png",
              "marker_img3.png",
              "marker_img4.png",
            ];
            const randomDogImg =
              dogsImages[Math.floor(Math.random() * dogsImages.length)];

            const dogMarkerImage = new window.kakao.maps.MarkerImage(
              `/images/${randomDogImg}`,
              imageSize,
              imageOption
            );

            const dogMarkerPosition = new window.kakao.maps.LatLng(
              dogLocation.lat,
              dogLocation.lng
            );

            const dogMarker = new window.kakao.maps.Marker({
              position: dogMarkerPosition,
              image: dogMarkerImage,
              clickable: true,
            });

            dogMarker.setMap(map);

            window.kakao.maps.event.addListener(dogMarker, "click", () => {
              map.panTo(dogMarkerPosition);
              setIsBottomOpen(true);
              setCurrDogInfo(dog.dogInfo);
            });
          })
          .catch((err) => {
            console.log("Error fetching dog address:", err);
          });
      });
    } catch (error) {
      console.log("Error creating markers:", error);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=5f4cba23c8b97ee09362b0fc03c5b2f4&autoload=false&libraries=services`;
    script.async = true;

    document.head.appendChild(script);

    script.onload = async () => {
      window.kakao.maps.load(async () => {
        try {
          const container = document.getElementById("map");
          const userAddr = await addressSearch(user?.address || "");

          if (container && userAddr) {
            // 마커 생성
            createMarker();
          }
        } catch (error) {
          console.error(error);
        }
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <div id="map" className="w-[100%] h-[100%]"></div>
      {isBottomOpen && <DogInfoBox currDogInfo={currDogInfo} />}
    </div>
  );
};

export default DogMap;
