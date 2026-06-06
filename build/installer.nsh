; 설치 마법사 글꼴을 Pretendard로 (설치 중에만 임시 등록)

!macro customHeader
  !define MUI_FONT "Pretendard"
  !define MUI_FONTSIZE 9
!macroend

; 설치 프로그램 초기화 시 Pretendard 임시 등록 (FR_PRIVATE)
!macro customInit
  InitPluginsDir
  File "/oname=$PLUGINSDIR\Pretendard.otf" "${BUILD_RESOURCES_DIR}\Pretendard.otf"
  System::Call 'gdi32::AddFontResourceExW(w "$PLUGINSDIR\Pretendard.otf", i 0x10, i 0) i .r0'
!macroend

; 제거 프로그램에서도 동일 적용
!macro customUnInit
  InitPluginsDir
  File "/oname=$PLUGINSDIR\Pretendard.otf" "${BUILD_RESOURCES_DIR}\Pretendard.otf"
  System::Call 'gdi32::AddFontResourceExW(w "$PLUGINSDIR\Pretendard.otf", i 0x10, i 0) i .r0'
!macroend

; 설치 시: 우클릭 "ImageZip으로 압축" 메뉴 등록 (현재 사용자, HKCU)
!macro customInstall
  WriteRegStr HKCU "Software\Classes\*\shell\ImageZipCompress" "" "ImageZip으로 압축"
  WriteRegStr HKCU "Software\Classes\*\shell\ImageZipCompress" "Icon" "$INSTDIR\ImageZip.exe,0"
  WriteRegStr HKCU "Software\Classes\*\shell\ImageZipCompress\command" "" '"$INSTDIR\ImageZip.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\Directory\shell\ImageZipCompress" "" "ImageZip으로 압축"
  WriteRegStr HKCU "Software\Classes\Directory\shell\ImageZipCompress" "Icon" "$INSTDIR\ImageZip.exe,0"
  WriteRegStr HKCU "Software\Classes\Directory\shell\ImageZipCompress\command" "" '"$INSTDIR\ImageZip.exe" "%1"'
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

; 제거 시: 우클릭 메뉴 제거
!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\*\shell\ImageZipCompress"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\ImageZipCompress"
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
